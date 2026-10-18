import { Router } from "express";
import crypto from "node:crypto";
import {
  Application,
  Scholarship,
  Notification,
  AuditLog,
  StudentProfile,
  Document,
} from "../models";
import { requireAuth, allowRoles, type AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);
const transitions: Record<string, string[]> = {
  staff: ["Under Department Verification", "Correction Required"],
  officer: ["Under Officer Verification", "Correction Required", "Rejected"],
  director: ["Approved", "Rejected", "Correction Required"],
  admin: [
    "Approved",
    "Rejected",
    "Correction Required",
    "Under Officer Verification",
    "Under Department Verification",
  ],
};
const PAGE_SIZE_MAX = 50;
const PAGE_SIZE_DEFAULT = 20;
const VALID_STATUSES = new Set([
  "Draft",
  "Submitted",
  "Under Department Verification",
  "Under Officer Verification",
  "Correction Required",
  "Approved",
  "Rejected",
]);

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    // ── Parse & validate pagination params ──────────────────────────────────
    const rawPage = parseInt(String(req.query.page ?? "1"), 10);
    const rawLimit = parseInt(String(req.query.limit ?? PAGE_SIZE_DEFAULT), 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, PAGE_SIZE_MAX)
      : PAGE_SIZE_DEFAULT;
    const skip = (page - 1) * limit;

    // ── Build filter ─────────────────────────────────────────────────────────
    const filter: Record<string, unknown> =
      req.user!.role === "student" ? { student: req.user!._id } : {};

    const rawStatus = String(req.query.status ?? "").trim();
    if (rawStatus && VALID_STATUSES.has(rawStatus)) {
      filter.status = rawStatus;
    }

    // ── Query in parallel: records + count ───────────────────────────────────
    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate("scholarship student verifications.actor")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Application.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
});
router.post("/", allowRoles("student"), async (req: AuthRequest, res, next) => {
  try {
    const scholarship = await Scholarship.findOne({
      _id: req.body.scholarship,
      published: true,
      deadline: { $gte: new Date() },
    });
    if (!scholarship)
      return res
        .status(400)
        .json({ message: "Scholarship is unavailable or expired" });
    const existing = await Application.findOne({
      student: req.user!._id,
      scholarship: scholarship._id,
      status: { $nin: ["Rejected"] },
    });
    if (existing)
      return res
        .status(409)
        .json({
          message: "You already have an application for this scholarship",
          application: existing,
        });
    const application = await Application.create({
      student: req.user!._id,
      scholarship: scholarship._id,
      status: "Draft",
      applicationNumber: `APP-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
    });
    await AuditLog.create({
      actor: req.user!._id,
      action: "APPLICATION_CREATED",
      entity: "Application",
      entityId: application.id,
    });
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
});
router.patch(
  "/:id",
  allowRoles("student"),
  async (req: AuthRequest, res, next) => {
    try {
      const application = await Application.findOne({
        _id: req.params.id,
        student: req.user!._id,
        status: { $in: ["Draft", "Correction Required"] },
      });
      if (!application)
        return res
          .status(404)
          .json({ message: "Editable application not found" });
      if (req.body.documents) {
        const documentIds = Array.isArray(req.body.documents)
          ? req.body.documents
          : [];
        const owned = await Document.find({
          _id: { $in: documentIds },
          owner: req.user!._id,
        }).select("_id");
        if (owned.length !== documentIds.length)
          return res
            .status(403)
            .json({
              message: "You can only attach documents that belong to you.",
            });
        application.documents = documentIds as any;
      }
      if (req.body.remarks !== undefined)
        application.remarks = String(req.body.remarks).slice(0, 2000);
      await application.save();
      res.json(await application.populate("scholarship documents"));
    } catch (error) {
      next(error);
    }
  },
);
router.patch(
  "/:id/submit",
  allowRoles("student"),
  async (req: AuthRequest, res, next) => {
    try {
      const application = await Application.findOne({
        _id: req.params.id,
        student: req.user!._id,
        status: { $in: ["Draft", "Correction Required"] },
      }).populate("scholarship student verifications.actor documents")
      if (!application)
        return res
          .status(400)
          .json({
            message:
              "Only draft or correction-required applications can be submitted",
          });
      const profile = await StudentProfile.findOne({ user: req.user!._id });
      if (
        !profile ||
        !profile.course ||
        !profile.academicYear ||
        profile.percentage == null ||
        profile.familyIncome == null ||
        !profile.category
      )
        return res
          .status(400)
          .json({
            message: "Complete your student profile before submitting.",
          });
      const scholarship: any = application.scholarship;
      const eligibility = scholarship.eligibility ?? {};

      const reasons: string[] = [];
      const missingData: string[] = [];
              
      // Percentage
      if (
        eligibility.minPercentage != null &&
        profile.percentage < eligibility.minPercentage
      ) {
        reasons.push(
          `Minimum percentage required: ${eligibility.minPercentage}%, but your percentage is ${profile.percentage}%.`
        );
      }
      
      // Annual family income
      if (
        eligibility.maxFamilyIncome != null &&
        profile.familyIncome > eligibility.maxFamilyIncome
      ) {
        reasons.push(
          `Maximum annual family income allowed is ₹${eligibility.maxFamilyIncome}. Your recorded income is ₹${profile.familyIncome}.`
        );
      }
      
      // Course
      if (
        eligibility.courses?.length &&
        !eligibility.courses.includes(profile.course)
      ) {
        reasons.push(`Your course (${profile.course}) is not eligible.`);
      }
      
      // Category
      if (
        eligibility.categories?.length &&
        !eligibility.categories.includes(profile.category)
      ) {
        reasons.push(`Your category (${profile.category}) is not eligible.`);
      }
      
      // Academic year
      if (
        eligibility.academicYears?.length &&
        !eligibility.academicYears.includes(profile.academicYear)
      ) {
        reasons.push(
          `Your academic year (${profile.academicYear}) is not eligible.`
        );
      }
      
      if (reasons.length > 0) {
        return res.status(400).json({
          message: "Your profile does not meet this scholarship's eligibility criteria.",
          reasons,
        });
      }

     

const required = scholarship.requiredDocuments ?? [];

      const normalizeDocumentType = (type: string) =>
        String(type ?? "")
          .toLowerCase()
          .trim()
          .replace(/[\s_-]+/g, "");

      const ownedDocuments = await Document.find({
        owner: req.user!._id,
      })
        .select("_id type originalName")
        .lean();

      const existingIds = (application.documents ?? []).map((doc: any) => {
        if (typeof doc === "string") return doc;
        if (doc && typeof doc === "object" && doc._id) {
          return String(doc._id);
        }
        return String(doc);
      });

      const matchingDocIds: string[] = [];
      for (const reqType of required) {
        const normReq = normalizeDocumentType(reqType);
        const matched = ownedDocuments.find(
          (doc: any) => normalizeDocumentType(doc.type) === normReq,
        );
        if (matched) {
          matchingDocIds.push(String(matched._id));
        }
      }

      const allDocumentIds = [
        ...new Set([...existingIds, ...matchingDocIds]),
      ];

      application.documents = allDocumentIds as any;

      const attachedDocs = ownedDocuments.filter((doc: any) =>
        allDocumentIds.includes(String(doc._id)),
      );

      const attachedTypes = new Set(
        attachedDocs.map((doc: any) => normalizeDocumentType(doc.type)),
      );

      const missingTypes = required.filter(
        (type: string) => !attachedTypes.has(normalizeDocumentType(type)),
      );

      if (missingTypes.length > 0) {
        return res.status(400).json({
          message:
            "Attach all required scholarship documents before submitting.",
          missingTypes,
          requiredTypes: required,
          attachedTypes: attachedDocs.map((doc: any) => doc.type),
        });
      }


application.status = "Submitted";
application.submittedAt = new Date();

await application.save();


      await Notification.create({
        user: req.user!._id,
        title: "Application submitted",
        message: `Application ${application.applicationNumber} was submitted.`,
      });

      await AuditLog.create({
        actor: req.user!._id,
        action: "APPLICATION_SUBMITTED",
        entity: "Application",
        entityId: application.id,
      });

      res.json(application);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id/status",
  allowRoles("staff", "officer", "director", "admin"),
  async (req: AuthRequest, res, next) => {
    try {
      const nextStatus = String(req.body.status);
      if (!transitions[req.user!.role]?.includes(nextStatus))
        return res
          .status(400)
          .json({
            message: "That status transition is not permitted for your role",
          });
      const application = await Application.findById(req.params.id);
      if (!application)
        return res.status(404).json({ message: "Application not found" });
      const validCurrent =
        req.user!.role === "staff"
          ? ["Submitted", "Under Department Verification"]
          : req.user!.role === "officer"
            ? ["Under Department Verification", "Under Officer Verification"]
            : req.user!.role === "director"
              ? ["Under Officer Verification"]
              : [
                  "Submitted",
                  "Under Department Verification",
                  "Under Officer Verification",
                  "Correction Required",
                ];
      const remarks = String(req.body.remarks ?? "").trim();
      if (nextStatus === "Correction Required" && !remarks)
        return res.status(400).json({
          message: "A correction reason or remark is required.",
        });
      if (nextStatus === "Rejected" && !remarks)
        return res.status(400).json({
          message: "A rejection reason or remark is required.",
        });
      if (!validCurrent.includes(application.status))
        return res
          .status(409)
          .json({ message: `Application is currently ${application.status}` });
      const resultingStatus =
        nextStatus === "Correction Required"
          ? nextStatus
          : nextStatus === "Rejected" || nextStatus === "Approved"
            ? nextStatus
            : nextStatus;
      application.status = resultingStatus;
      application.remarks = String(req.body.remarks ?? "").slice(0, 2000);
      application.verifications.push({
        actor: req.user!._id,
        role: req.user!.role,
        status: resultingStatus,
        remarks: application.remarks,
      });
      await application.save();
      await Notification.create({
        user: application.student,
        title: `Application ${resultingStatus.toLowerCase()}`,
        message:
          application.remarks || `Your application is now ${resultingStatus}.`,
      });
      await AuditLog.create({
        actor: req.user!._id,
        action:
          req.user!.role === "admin"
            ? "ADMIN_STATUS_OVERRIDE"
            : "STATUS_UPDATED",
        entity: "Application",
        entityId: application.id,
        remarks: application.remarks,
      });
      res.json(application);
    } catch (error) {
      console.error("APPLICATION STATUS UPDATE FAILED:", error);
      next(error);
    }

  },
);
export default router;

import mongoose, { Schema } from 'mongoose'

const verificationSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['staff', 'officer', 'admin'], required: true },
  status: { type: String, required: true },
  remarks: { type: String, trim: true, maxlength: 2000 },
}, { timestamps: true })

const userSchema = new Schema({ name: { type: String, required: true, trim: true, maxlength: 120 }, email: { type: String, required: true, unique: true, lowercase: true, index: true }, passwordHash: { type: String, required: true }, role: { type: String, enum: ['student', 'staff', 'officer', 'admin'], default: 'student', index: true }, studentId: { type: String, unique: true, sparse: true, trim: true }, department: { type: String, trim: true } }, { timestamps: true })
const profileSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true }, course: String, academicYear: String, semester: { type: Number, min: 1, max: 20 }, percentage: { type: Number, min: 0, max: 100 }, familyIncome: { type: Number, min: 0 }, category: String, bankDetails: { accountLast4: { type: String, match: /^\d{4}$/ }, ifsc: String }, documents: [{ type: Schema.Types.ObjectId, ref: 'Document' }] }, { timestamps: true })
const scholarshipSchema = new Schema({ name: { type: String, required: true, trim: true }, provider: { type: String, required: true, trim: true }, description: String, amount: { type: Number, required: true, min: 0 }, deadline: { type: Date, required: true, index: true }, published: { type: Boolean, default: false, index: true }, eligibility: { minPercentage: { type: Number, min: 0, max: 100 }, maxFamilyIncome: { type: Number, min: 0 }, courses: [String], categories: [String], academicYears: [String] }, requiredDocuments: [String] }, { timestamps: true })
const applicationSchema = new Schema({ applicationNumber: { type: String, unique: true, index: true }, student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, scholarship: { type: Schema.Types.ObjectId, ref: 'Scholarship', required: true }, status: { type: String, enum: ['Draft', 'Submitted', 'Under Department Verification', 'Under Officer Verification', 'Correction Required', 'Approved', 'Rejected'], default: 'Draft', index: true }, remarks: { type: String, maxlength: 2000 }, submittedAt: Date, documents: [{ type: Schema.Types.ObjectId, ref: 'Document' }], verifications: [verificationSchema] }, { timestamps: true })
const documentSchema = new Schema({ owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, application: { type: Schema.Types.ObjectId, ref: 'Application', index: true }, type: { type: String, required: true, trim: true }, originalName: String, storedName: String, mimeType: String, size: { type: Number, max: 10 * 1024 * 1024 }, content: { type: Buffer, select: false } }, { timestamps: true })
const notificationSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, title: { type: String, required: true }, message: { type: String, required: true }, read: { type: Boolean, default: false, index: true } }, { timestamps: true })
const auditSchema = new Schema({ actor: { type: Schema.Types.ObjectId, ref: 'User' }, action: { type: String, required: true }, entity: { type: String, required: true }, entityId: String, remarks: String }, { timestamps: true })

export const User = mongoose.models.User || mongoose.model('User', userSchema)
export const StudentProfile = mongoose.models.StudentProfile || mongoose.model('StudentProfile', profileSchema)
export const Scholarship = mongoose.models.Scholarship || mongoose.model('Scholarship', scholarshipSchema)
export const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema)
export const Document = mongoose.models.Document || mongoose.model('Document', documentSchema)
export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema)
export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditSchema)
export const Verification = mongoose.models.Verification || mongoose.model('Verification', verificationSchema)

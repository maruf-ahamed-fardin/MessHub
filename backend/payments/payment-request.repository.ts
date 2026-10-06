import { getPrisma } from "@/lib/db/prisma";
import { createPayment } from "@/backend/payments/payment.repository";
import { createNotification } from "@/backend/notifications/notification.service";
import { PaymentMethod, PaymentRequestStatus } from "@prisma/client";

export interface CreatePaymentRequestInput {
  memberId: string;
  amount: number;
  method: PaymentMethod;
  trxId?: string;
  senderPhone?: string;
  note?: string;
}

export async function createPaymentRequest(data: CreatePaymentRequestInput) {
  const db = getPrisma();
  return db.paymentRequest.create({
    data: {
      memberId: data.memberId,
      amount: data.amount,
      method: data.method,
      trxId: data.trxId?.trim() || null,
      senderPhone: data.senderPhone?.trim() || null,
      note: data.note?.trim() || null,
      status: PaymentRequestStatus.PENDING,
    },
    include: {
      member: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });
}

export async function getPendingPaymentRequests() {
  const db = getPrisma();
  return db.paymentRequest.findMany({
    where: { status: PaymentRequestStatus.PENDING },
    orderBy: { createdAt: "desc" },
    include: {
      member: {
        include: {
          user: { select: { id: true, name: true, image: true } },
          room: { select: { name: true } },
          seat: { select: { label: true } },
        },
      },
    },
  });
}

export async function getMemberPaymentRequests(memberId: string) {
  const db = getPrisma();
  return db.paymentRequest.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function approvePaymentRequest(requestId: string, adminUserId: string) {
  const db = getPrisma();

  const req = await db.paymentRequest.findUnique({
    where: { id: requestId },
    include: { member: { include: { user: true } } },
  });

  if (!req) {
    throw new Error("Payment request not found");
  }

  if (req.status !== PaymentRequestStatus.PENDING) {
    throw new Error(`This request has already been ${req.status.toLowerCase()}`);
  }

  // 1. Update Request
  const updatedReq = await db.paymentRequest.update({
    where: { id: requestId },
    data: {
      status: PaymentRequestStatus.APPROVED,
      reviewedById: adminUserId,
      reviewedAt: new Date(),
    },
  });

  // 2. Automatically record confirmed payment in the ledger
  const noteText = req.trxId
    ? `Approve: TrxID ${req.trxId}${req.note ? ` (${req.note})` : ""}`
    : req.note || "Approved Deposit Request";

  await createPayment({
    memberId: req.memberId,
    amount: req.amount,
    date: new Date(),
    method: req.method,
    note: noteText,
    recordedById: adminUserId,
  });

  // 3. Notify member
  if (req.member?.user?.id) {
    await createNotification({
      userId: req.member.user.id,
      title: "জমা নিশ্চিত হয়েছে ✓ (Payment Approved)",
      message: `আপনার ৳${req.amount.toLocaleString()} জমার অনুরোধ (${req.method}${req.trxId ? ` - TrxID: ${req.trxId}` : ""}) এডমিন কর্তৃক ভেরিফাই ও গৃহীত হয়েছে।`,
      type: "PAYMENT_RECORDED",
      relatedId: requestId,
      relatedType: "PaymentRequest",
    });
  }

  return updatedReq;
}

export async function rejectPaymentRequest(
  requestId: string,
  adminUserId: string,
  rejectionReason?: string
) {
  const db = getPrisma();

  const req = await db.paymentRequest.findUnique({
    where: { id: requestId },
    include: { member: { include: { user: true } } },
  });

  if (!req) {
    throw new Error("Payment request not found");
  }

  if (req.status !== PaymentRequestStatus.PENDING) {
    throw new Error(`This request has already been ${req.status.toLowerCase()}`);
  }

  const updatedReq = await db.paymentRequest.update({
    where: { id: requestId },
    data: {
      status: PaymentRequestStatus.REJECTED,
      rejectionReason: rejectionReason?.trim() || "Information or Transaction ID could not be verified",
      reviewedById: adminUserId,
      reviewedAt: new Date(),
    },
  });

  // Notify member
  if (req.member?.user?.id) {
    await createNotification({
      userId: req.member.user.id,
      title: "জমা বাতিল করা হয়েছে ✕ (Payment Rejected)",
      message: `আপনার ৳${req.amount.toLocaleString()} জমার অনুরোধ বাতিল করা হয়েছে। কারণ: ${rejectionReason || "TrxID বা তথ্যে গরমিল পাওয়া গেছে।"}`,
      type: "PAYMENT_RECORDED",
      relatedId: requestId,
      relatedType: "PaymentRequest",
    });
  }

  return updatedReq;
}

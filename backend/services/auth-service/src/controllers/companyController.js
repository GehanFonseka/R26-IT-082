import { createCompanyAdmin, deleteCompanyAdmin, requireCompanyMember, requireCompanyOwner } from "../services/companyService.js";
import { userRepository } from "../repositories/userRepository.js";

export const listAdmins = async (req, res) => {
  const member = await requireCompanyMember(req);
  res.json({ success: true, data: await userRepository.listAdmins(member.companyId), requestId: req.requestId });
};

export const createAdmin = async (req, res) => {
  const owner = await requireCompanyOwner(req);
  res.status(201).json({ success: true, data: await createCompanyAdmin(owner, req.body), requestId: req.requestId });
};

export const deleteAdmin = async (req, res) => {
  const owner = await requireCompanyOwner(req);
  res.json({ success: true, data: await deleteCompanyAdmin(owner, req.params.adminId), requestId: req.requestId });
};

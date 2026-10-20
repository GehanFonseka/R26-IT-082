import { registerProxyPart1 } from "./proxyPart1.js";
import { registerProxyPart2 } from "./proxyPart2.js";
import { registerCompanyRoutes } from "./companyRoutes.js";
import { registerCertificateRoutes } from "./certificateRoutes.js";
import { registerCandidateCertificateRoutes } from "./candidateCertificateRoutes.js";
import { registerAdminCertificateRoutes } from "./adminCertificateRoutes.js";

export const registerProxyRoutes = (app) => {
  registerProxyPart1(app);
  registerProxyPart2(app);
  registerCompanyRoutes(app);
  registerCertificateRoutes(app);
  registerCandidateCertificateRoutes(app);
  registerAdminCertificateRoutes(app);
};

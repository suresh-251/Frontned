// import { useState } from "react";
// import { Outlet, useNavigate, useParams } from "react-router-dom";
// import { createBrand, switchBrand } from "../api/brand.api";

// export default function BrandGate() {
//   const navigate = useNavigate();
//   const { domainCode } = useParams();

//   const [brandIdInput, setBrandIdInput] = useState("");
//   const [brandName, setBrandName] = useState("");
//   const [loading, setLoading] = useState(false);

//   const storedBrandId = localStorage.getItem("brandId");

//   // ✅ If brand already selected → allow access
//   if (storedBrandId) {
//     return <Outlet />;
//   }

//   const goToDashboard = () => {
//     navigate(`/crm/${domainCode}/dashboard`, { replace: true });
//   };

//   /* =========================================
//      LOGIN WITH EXISTING BRAND
//   ========================================= */
//   const handleLoginWithBrand = async () => {
//     if (!brandIdInput) return alert("Enter Brand ID");

//     try {
//       setLoading(true);

//       // 🔥 Tell backend active brand
//       await switchBrand(brandIdInput);

//       // 🔥 Save locally
//       localStorage.setItem("brandId", brandIdInput);

//       goToDashboard();
//     } catch (err) {
//       alert("Invalid Brand ID");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* =========================================
//      CREATE NEW BRAND
//   ========================================= */
//   const handleCreateBrand = async () => {
//     if (!brandName) return alert("Enter Brand Name");

//     try {
//       setLoading(true);

//       const newBrandId = await createBrand(brandName);

//       // 🔥 Activate in backend
//       await switchBrand(newBrandId);

//       localStorage.setItem("brandId", newBrandId);

//       goToDashboard();
//     } catch (err) {
//       alert(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ padding: 40, textAlign: "center" }}>
//       <h2>Brand Setup Required</h2>

//       <div style={{ marginTop: 20 }}>
//         <h4>Login With Existing Brand ID</h4>
//         <input
//           type="text"
//           placeholder="Enter Brand ID"
//           value={brandIdInput}
//           onChange={(e) => setBrandIdInput(e.target.value)}
//         />
//         <br /><br />
//         <button onClick={handleLoginWithBrand} disabled={loading}>
//           {loading ? "Processing..." : "Login with Brand ID"}
//         </button>
//       </div>

//       <hr style={{ margin: "30px 0" }} />

//       <div>
//         <h4>Create New Brand</h4>
//         <input
//           type="text"
//           placeholder="Enter Brand Name"
//           value={brandName}
//           onChange={(e) => setBrandName(e.target.value)}
//         />
//         <br /><br />
//         <button onClick={handleCreateBrand} disabled={loading}>
//           {loading ? "Creating..." : "Add Brand"}
//         </button>
//       </div>
//     </div>
//   );
// }
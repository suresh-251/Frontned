// // import { useEffect, useState } from "react";
// // import { createBrand, switchBrand } from "../api/brand.api";
// // import { useNavigate } from "react-router-dom";

// // export default function BrandGate({ children }) {
// //   const navigate = useNavigate();

// //   const [brandId, setBrandId] = useState(localStorage.getItem("brandId"));
// //   const [showCreate, setShowCreate] = useState(false);
// //   const [brandName, setBrandName] = useState("");
// //   const [existingBrandId, setExistingBrandId] = useState("");

// //   /* If brand exists allow access */
// //   useEffect(() => {
// //     if (brandId) return;
// //   }, [brandId]);

// //   /* CREATE BRAND */
// //   const handleCreateBrand = async () => {
// //     try {
// //       const res = await createBrand(brandName);
// //       const newBrandId = res.brandId;

// //       localStorage.setItem("brandId", newBrandId);
// //       setBrandId(newBrandId);

// //       window.location.reload();
// //     } catch (err) {
// //       alert(err.message);
// //     }
// //   };

// //   /* LOGIN WITH EXISTING BRAND */
// //   const handleExistingBrand = async () => {
// //     try {
// //       await switchBrand(existingBrandId);

// //       localStorage.setItem("brandId", existingBrandId);
// //       setBrandId(existingBrandId);

// //       window.location.reload();
// //     } catch (err) {
// //       alert("Invalid Brand ID");
// //     }
// //   };

// //   if (brandId) return children;

// //   return (
// //     <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">

// //       <div className="bg-white/70 backdrop-blur-xl p-10 rounded-2xl shadow-2xl w-[450px] text-center">

// //         <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
// //           Select or Create Brand
// //         </h2>

// //         {/* CREATE BRAND */}
// //         <button
// //           onClick={() => setShowCreate(true)}
// //           className="w-full mb-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:scale-105 transition"
// //         >
// //           Create New Brand
// //         </button>

// //         {/* EXISTING BRAND */}
// //         <div className="mt-6">
// //           <input
// //             type="text"
// //             placeholder="Enter Existing Brand ID"
// //             className="w-full p-3 border rounded-lg mb-3"
// //             value={existingBrandId}
// //             onChange={(e) => setExistingBrandId(e.target.value)}
// //           />

// //           <button
// //             onClick={handleExistingBrand}
// //             className="w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-black transition"
// //           >
// //             Login with Brand ID
// //           </button>
// //         </div>

// //         {/* CREATE MODAL */}
// //         {showCreate && (
// //           <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center">

// //             <div className="bg-white p-8 rounded-xl shadow-xl w-[400px]">

// //               <h3 className="text-lg font-semibold mb-4">Create Brand</h3>

// //               <input
// //                 type="text"
// //                 placeholder="Brand Name"
// //                 className="w-full p-3 border rounded-lg mb-4"
// //                 value={brandName}
// //                 onChange={(e) => setBrandName(e.target.value)}
// //               />

// //               <div className="flex justify-end gap-3">
// //                 <button
// //                   onClick={() => setShowCreate(false)}
// //                   className="px-4 py-2 bg-gray-200 rounded-lg"
// //                 >
// //                   Cancel
// //                 </button>

// //                 <button
// //                   onClick={handleCreateBrand}
// //                   className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
// //                 >
// //                   Add Brand
// //                 </button>
// //               </div>

// //             </div>
// //           </div>
// //         )}

// //       </div>
// //     </div>
// //   );
// // }



// import { useEffect, useState } from "react";
// import { Outlet, useNavigate } from "react-router-dom";
// import { createBrand } from "../api/brand.api";

// export default function BrandGate() {
//   const navigate = useNavigate();
//   const [brandIdInput, setBrandIdInput] = useState("");
//   const [brandName, setBrandName] = useState("");
//   const [loading, setLoading] = useState(false);

//   const storedBrandId = localStorage.getItem("brandId");

//   // 🔥 If brandId exists → allow dashboard
//   if (storedBrandId) {
//     return <Outlet />;
//   }

//   // 🔹 Login with existing brand ID
//   const handleLoginWithBrand = () => {
//     if (!brandIdInput) return alert("Enter Brand ID");

//     localStorage.setItem("brandId", brandIdInput);

//     // 🔥 Navigate to dashboard
//     navigate("/crm/socialmedia/dashboard", { replace: true });
//   };

//   // 🔹 Create new brand
//   const handleCreateBrand = async () => {
//     if (!brandName) return alert("Enter Brand Name");

//     try {
//       setLoading(true);

//       const newBrandId = await createBrand(brandName);

//       // Save generated brandId
//       localStorage.setItem("brandId", newBrandId);

//       navigate("/dashboard", { replace: true });
//     } catch (err) {
//       alert(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 🔹 UI
//   return (
//     <div style={{ padding: "40px", textAlign: "center" }}>
//       <h2>Brand Setup Required</h2>

//       <div style={{ marginTop: "20px" }}>
//         <h4>Login With Existing Brand ID</h4>
//         <input
//           type="text"
//           placeholder="Enter Brand ID"
//           value={brandIdInput}
//           onChange={(e) => setBrandIdInput(e.target.value)}
//         />
//         <br /><br />
//         <button onClick={handleLoginWithBrand}>
//           Login with Brand ID
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











import { useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { createBrand, switchBrand } from "../api/brand.api";

export default function BrandGate() {
  const navigate = useNavigate();
  const { domainCode } = useParams();

  const [brandIdInput, setBrandIdInput] = useState("");
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(false);

  const storedBrandId = localStorage.getItem("brandId");

  // ✅ If brand already selected → allow access
  if (storedBrandId) {
    return <Outlet />;
  }

  const goToDashboard = () => {
    navigate(`/crm/${domainCode}/dashboard`, { replace: true });
  };

  /* =========================================
     LOGIN WITH EXISTING BRAND
  ========================================= */
  const handleLoginWithBrand = async () => {
    if (!brandIdInput) return alert("Enter Brand ID");

    try {
      setLoading(true);

      // 🔥 Tell backend active brand
      await switchBrand(brandIdInput);

      // 🔥 Save locally
      localStorage.setItem("brandId", brandIdInput);

      goToDashboard();
    } catch (err) {
      alert("Invalid Brand ID");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     CREATE NEW BRAND
  ========================================= */
  const handleCreateBrand = async () => {
    if (!brandName) return alert("Enter Brand Name");

    try {
      setLoading(true);

      const newBrandId = await createBrand(brandName);

      // 🔥 Activate in backend
      await switchBrand(newBrandId);

      localStorage.setItem("brandId", newBrandId);

      goToDashboard();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Brand Setup Required</h2>

      <div style={{ marginTop: 20 }}>
        <h4>Login With Existing Brand ID</h4>
        <input
          type="text"
          placeholder="Enter Brand ID"
          value={brandIdInput}
          onChange={(e) => setBrandIdInput(e.target.value)}
        />
        <br /><br />
        <button onClick={handleLoginWithBrand} disabled={loading}>
          {loading ? "Processing..." : "Login with Brand ID"}
        </button>
      </div>

      <hr style={{ margin: "30px 0" }} />

      <div>
        <h4>Create New Brand</h4>
        <input
          type="text"
          placeholder="Enter Brand Name"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
        />
        <br /><br />
        <button onClick={handleCreateBrand} disabled={loading}>
          {loading ? "Creating..." : "Add Brand"}
        </button>
      </div>
    </div>
  );
}
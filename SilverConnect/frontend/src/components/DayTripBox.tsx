// import React from "react";

// interface Place {
//   name: string;
//   lat: number;
//   lng: number;
//   distance?: number;
// }

// interface DayTripBoxProps {
//   cc: Place | null;
//   hawkers: Place[];
//   parks: Place[];
//   hasActivity: boolean;
// }

// export default function DayTripBox({ cc, hawkers, parks, hasActivity }: DayTripBoxProps) {
//   return (
//     <div className="mt-6 p-6 rounded-2xl border border-gray-200 bg-white shadow-md">
//       <h2 className="text-2xl font-bold text-gray-800 mb-4">Daytrip Suggestions</h2>

//       {!hasActivity || !cc ? (
//         <p className="text-gray-600">
//           No recommended daytrips available. The user has not registered any upcoming activities.
//         </p>
//       ) : (
//         <>
//           <div className="mb-4">
//             <h3 className="text-lg font-semibold text-gray-800">
//               Starting Point (Community Club)
//             </h3>
//             <p className="text-gray-600">{cc.name}</p>
//             <p className="text-sm text-gray-500">
//               ({cc.lat.toFixed(4)}, {cc.lng.toFixed(4)})
//             </p>
//           </div>

//           <div className="mb-4">
//             <h3 className="text-lg font-semibold text-orange-700">Nearby Hawker Centres</h3>
//             {hawkers.length > 0 ? (
//               <ul className="list-disc pl-5 text-gray-700 text-sm">
//                 {hawkers.map((h, i) => (
//                   <li key={i}>
//                     {h.name} — {h.distance?.toFixed(2)} km
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <p className="text-sm text-gray-600">No hawker centres within 2km.</p>
//             )}
//           </div>

//           <div>
//             <h3 className="text-lg font-semibold text-green-700">Nearby Parks</h3>
//             {parks.length > 0 ? (
//               <ul className="list-disc pl-5 text-gray-700 text-sm">
//                 {parks.map((p, i) => (
//                   <li key={i}>
//                     {p.name} — {p.distance?.toFixed(2)} km
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <p className="text-sm text-gray-600">No parks within 2km.</p>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

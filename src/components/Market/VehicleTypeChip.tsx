import { JargonGloss } from "../Layout/JargonGloss";
import { VEHICLE_TYPE_GLOSS, type VehicleType } from "../../lib/mock/vehicles";

export function VehicleTypeChip({ type }: { type: VehicleType }) {
  return (
    <span className="veh-type-chip">
      <JargonGloss term={type}>{VEHICLE_TYPE_GLOSS[type]}</JargonGloss>
    </span>
  );
}

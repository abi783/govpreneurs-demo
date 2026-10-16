// Section grouping for WORK_TYPES (lib/vocab/trades.ts), used to organize
// the onboarding wizard's work-type picker (OnboardingTreePicker step 1) into
// the same 10 editorial buckets the govpreneurs-v2 reference uses for its
// `workCategories.ts` groups. Every WORK_TYPES id must map to exactly one of
// these section labels; `sectionOf()` is the safe accessor other modules
// should use so a catalog addition without a mapping never crashes (falls
// back to the catch-all "Supply & Other" bucket instead).

export const WORK_SECTIONS = [
  "Construction & Trades",
  "Facilities & Grounds",
  "Food & Hospitality",
  "Logistics & Transport",
  "Professional Services",
  "Technology",
  "Marketing & Creative",
  "Security & Safety",
  "Health & Environment",
  "Supply & Other",
] as const;

export type WorkSection = (typeof WORK_SECTIONS)[number];

/** Every WORK_TYPES id → one of the 10 section labels above. */
export const WORK_TYPE_SECTIONS: Record<string, WorkSection> = {
  // Construction & Trades
  roofing_and_roof_systems: "Construction & Trades",
  siding_windows_and_doors: "Construction & Trades",
  painting_and_coatings: "Construction & Trades",
  masonry_and_building_exterior: "Construction & Trades",
  concrete_and_structural_contracting: "Construction & Trades",
  framing_and_finish_carpentry: "Construction & Trades",
  drywall_and_insulation: "Construction & Trades",
  flooring_tile_and_terrazzo: "Construction & Trades",
  electrical_contracting: "Construction & Trades",
  plumbing_hvac_and_mechanical: "Construction & Trades",
  site_work_excavation_and_utilities: "Construction & Trades",
  specialty_trade_contracting: "Construction & Trades",
  residential_building_construction: "Construction & Trades",
  commercial_and_institutional_building: "Construction & Trades",
  highway_street_and_bridge_construction: "Construction & Trades",
  heavy_and_civil_engineering_construction: "Construction & Trades",
  structural_and_architectural_metals: "Construction & Trades",
  asphalt_and_paving_materials: "Construction & Trades",

  // Facilities & Grounds
  janitorial_and_facility_cleaning: "Facilities & Grounds",
  landscaping_and_grounds_maintenance: "Facilities & Grounds",
  facilities_support_and_base_operations: "Facilities & Grounds",
  pest_control: "Facilities & Grounds",
  waste_collection_and_disposal: "Facilities & Grounds",
  environmental_remediation_and_hazmat: "Facilities & Grounds",
  laundry_and_linen_services: "Facilities & Grounds",

  // Professional Services
  environmental_consulting_and_testing: "Health & Environment",
  architecture_engineering_and_surveying: "Professional Services",
  design_services_graphic_interior_industrial: "Marketing & Creative",
  legal_services: "Professional Services",
  accounting_tax_and_bookkeeping: "Professional Services",
  management_and_business_consulting: "Professional Services",
  marketing_advertising_and_media_production: "Marketing & Creative",
  translation_and_interpretation: "Professional Services",
  research_development_and_testing_labs: "Professional Services",

  // Technology
  it_services_and_software: "Technology",
  it_hardware_and_equipment: "Technology",
  cybersecurity: "Technology",
  telecommunications_and_networking: "Technology",
  electronic_and_precision_equipment_repair: "Technology",
  information_and_data_services: "Technology",
  publishing_and_media: "Marketing & Creative",

  // Security & Safety
  security_guard_and_protective_services: "Security & Safety",
  security_systems_and_locksmith: "Security & Safety",
  arms_ammunition_and_ordnance: "Security & Safety",
  defense_aerospace_and_military_vehicles: "Security & Safety",

  // Logistics & Transport
  trucking_and_freight_hauling: "Logistics & Transport",
  courier_and_last_mile_delivery: "Logistics & Transport",
  warehousing_and_storage: "Logistics & Transport",
  logistics_and_freight_support: "Logistics & Transport",
  transportation_support_services: "Logistics & Transport",
  air_rail_and_marine_transportation: "Logistics & Transport",
  passenger_transportation_and_shuttle: "Logistics & Transport",
  pipeline_transportation: "Logistics & Transport",
  vehicle_and_fleet_maintenance: "Logistics & Transport",
  postal_and_courier_services: "Logistics & Transport",

  // Food & Hospitality
  food_service_and_catering: "Food & Hospitality",
  lodging_and_accommodation: "Food & Hospitality",
  travel_tourism_and_sightseeing: "Food & Hospitality",
  event_and_trade_show_services: "Food & Hospitality",

  // Health & Environment
  healthcare_and_medical_services: "Health & Environment",
  nursing_and_residential_care: "Health & Environment",
  medical_and_diagnostic_labs: "Health & Environment",
  social_and_community_services: "Health & Environment",
  veterinary_services: "Health & Environment",

  // Professional Services (staffing / admin / training)
  staffing_and_human_resources: "Professional Services",
  administrative_and_office_support: "Professional Services",
  call_center_and_answering_services: "Professional Services",
  collections_and_credit_services: "Professional Services",
  training_and_educational_services: "Professional Services",

  // Supply & Other — manufacturing
  metal_fabrication_and_machining: "Supply & Other",
  primary_metals_and_foundries: "Supply & Other",
  machinery_and_equipment_manufacturing: "Supply & Other",
  electronics_and_instruments_manufacturing: "Supply & Other",
  electrical_equipment_and_appliances: "Supply & Other",
  transportation_equipment_manufacturing: "Supply & Other",
  medical_dental_and_misc_manufacturing: "Supply & Other",
  textiles_apparel_and_uniforms: "Supply & Other",
  food_beverage_and_tobacco_manufacturing: "Supply & Other",
  wood_products_and_furniture: "Supply & Other",
  chemicals_paints_and_pharmaceuticals: "Supply & Other",
  plastics_and_rubber_products: "Supply & Other",
  glass_clay_concrete_and_stone_products: "Supply & Other",
  printing_and_paper_products: "Supply & Other",
  petroleum_and_coal_products: "Supply & Other",
  other_manufacturing_and_production: "Supply & Other",

  // Supply & Other — distribution / wholesale / retail
  construction_and_building_material_supply: "Supply & Other",
  vehicle_and_parts_distribution: "Supply & Other",
  office_and_computer_equipment_supply: "Supply & Other",
  medical_and_scientific_supply_distribution: "Supply & Other",
  electrical_and_electronics_distribution: "Supply & Other",
  agricultural_and_farm_supply: "Supply & Other",
  food_and_grocery_distribution: "Supply & Other",
  apparel_and_textile_distribution: "Supply & Other",
  fuel_and_petroleum_distribution: "Supply & Other",
  wholesale_distribution_general: "Supply & Other",
  retail_and_product_resale: "Supply & Other",

  // Supply & Other — farming / mining / utilities / finance / real estate / misc
  farming_and_agricultural_production: "Supply & Other",
  agricultural_support_services: "Supply & Other",
  forestry_and_logging: "Supply & Other",
  fishing_hunting_and_aquaculture: "Supply & Other",
  mining_quarrying_and_extraction: "Supply & Other",
  utilities_power_water_gas: "Supply & Other",
  finance_banking_and_insurance: "Supply & Other",
  real_estate_and_property_management: "Supply & Other",
  equipment_and_vehicle_rental_leasing: "Supply & Other",
  arts_events_and_recreation: "Supply & Other",
  repair_and_maintenance_services: "Supply & Other",
  personal_and_consumer_services: "Supply & Other",
  membership_and_community_organizations: "Supply & Other",
  management_of_companies_and_enterprises: "Supply & Other",
  public_administration_support: "Supply & Other",
};

/** Safe accessor: falls back to "Supply & Other" for any id not yet mapped
 *  (e.g. a WORK_TYPES entry added later without a section update), so catalog
 *  drift never crashes the picker. */
export function sectionOf(id: string): WorkSection {
  return WORK_TYPE_SECTIONS[id] ?? "Supply & Other";
}

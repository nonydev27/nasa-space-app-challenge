// Multi-Criteria Decision Analysis (MCDA) Rotation Scoring Engine
// Evaluates crop rotation alternatives using NASA Earth Observations and Farmer Priorities

export function evaluateRotationStrategies(regionData, farmerPriorities, climateScenario) {
  const { waterConservation, soilHealth, supplementalRevenue, lowEquipmentOverhead } = farmerPriorities;
  const { tempDelta, rainDelta } = climateScenario;

  // Total weight normalization
  const sumWeights = Math.max(1, waterConservation + soilHealth + supplementalRevenue + lowEquipmentOverhead);
  const wWater = waterConservation / sumWeights;
  const wSoil = soilHealth / sumWeights;
  const wRevenue = supplementalRevenue / sumWeights;
  const wEquip = lowEquipmentOverhead / sumWeights;

  const strategies = getCandidateStrategiesForRegion(regionData.id);

  return strategies.map((strat) => {
    // 1. Calculate Water Score (0-100)
    // Higher score if water use is low, especially under negative rainDelta or positive tempDelta
    const baselineWater = strat.isBaseline ? strat.waterUseMm : getBaselineWater(regionData.id);
    const waterSavingsPct = Math.max(-30, Math.min(65, ((baselineWater - strat.waterUseMm) / Math.max(1, baselineWater)) * 100));
    
    // Climate sensitivity penalty/bonus
    const climateDroughtStress = Math.max(0, (tempDelta * 4) - (rainDelta * 0.8));
    const climateAdjustedWaterScore = strat.droughtResilienceScore - (strat.waterSensitivity * climateDroughtStress * 0.4);
    const finalWaterScore = Math.max(15, Math.min(99, climateAdjustedWaterScore + (waterSavingsPct * 0.5)));

    // 2. Calculate Soil Health Score (0-100)
    const nFixScore = Math.min(100, (strat.nitrogenFixKgHa / 120) * 100);
    const somScore = strat.somBuildRating * 20; // 1-5 scale to 100
    const erosionScore = strat.erosionReductionPct;
    const finalSoilScore = (nFixScore * 0.35) + (somScore * 0.35) + (erosionScore * 0.30);

    // 3. Calculate Revenue & Market Score (0-100)
    // Baseline usually has high market liquidity, while diversified pulses have slightly higher market friction
    let finalRevenueScore = strat.marketLiquidityScore;
    if (rainDelta < -15 || tempDelta > 1.5) {
      // In dry/hot climate scenarios, baseline monocultures suffer yield drops while resilient crops hold value
      if (strat.isBaseline) finalRevenueScore -= (tempDelta * 8) - (rainDelta * 0.3);
      else finalRevenueScore += 10;
    }
    finalRevenueScore = Math.max(20, Math.min(98, finalRevenueScore));

    // 4. Calculate Equipment & Feasibility Score (0-100)
    const finalEquipScore = strat.equipmentFeasibilityScore;

    // Weighted Overall Strategy Score
    const compositeScore = Math.round(
      (finalWaterScore * wWater) +
      (finalSoilScore * wSoil) +
      (finalRevenueScore * wRevenue) +
      (finalEquipScore * wEquip)
    );

    // Calculate tangible farm metrics
    const waterSavedMm = strat.isBaseline ? 0 : Math.max(0, baselineWater - strat.waterUseMm);
    const fertilizerSavedDollarPerAcre = Math.round((strat.nitrogenFixKgHa * 0.89) * 0.95); // ~$0.95/lb N
    const bareDaysReduced = strat.isBaseline ? 0 : strat.bareDaysEliminated;

    return {
      ...strat,
      compositeScore,
      finalWaterScore: Math.round(finalWaterScore),
      finalSoilScore: Math.round(finalSoilScore),
      finalRevenueScore: Math.round(finalRevenueScore),
      finalEquipScore: Math.round(finalEquipScore),
      waterSavedMm,
      fertilizerSavedDollarPerAcre,
      bareDaysReduced
    };
  }).sort((a, b) => b.compositeScore - a.compositeScore);
}

function getBaselineWater(regionId) {
  switch (regionId) {
    case 'nevada': return 750;
    case 'iowa': return 620;
    case 'california': return 780;
    case 'plains': return 460;
    default: return 600;
  }
}

function getCandidateStrategiesForRegion(regionId) {
  if (regionId === 'nevada') {
    return [
      {
        id: 'nevada-baseline',
        isBaseline: true,
        title: 'Baseline: Continuous Alfalfa Stand (7-8 Yr Monoculture)',
        cropSequence: ['Alfalfa (Cut 1-4)', 'Winter Bare Ground'],
        category: 'Existing Monoculture',
        waterUseMm: 750,
        waterSensitivity: 1.8,
        droughtResilienceScore: 40,
        nitrogenFixKgHa: 80,
        somBuildRating: 3.2,
        erosionReductionPct: 35,
        marketLiquidityScore: 92,
        equipmentFeasibilityScore: 95,
        bareDaysEliminated: 0,
        netReturnEstimate: 'Baseline ($520/acre gross forage)',
        whySuggested: 'Current farm practice; deep established market for high-protein export and local dairy hay.',
        nasaEvidence: 'ECOSTRESS tracks heavy seasonal ET consumption (7.8 mm/day). Landsat records 140 days of bare, wind-eroded soil during winter dormant months.',
        informationGaps: 'Exact pivot nozzle efficiency across field corners; local water district allocation cuts for the next 24 months.',
        localRisksRequiringReview: 'Severe groundwater drawdown (GRACE shows -2.4 cm/yr); vulnerable to mid-summer delivery cutoffs.'
      },
      {
        id: 'nevada-water-conserver',
        isBaseline: false,
        title: 'Strategy A: Sorghum-Sudangrass + Winter Triticale Armor',
        cropSequence: ['BMR Sorghum-Sudangrass', 'Winter Triticale / Cereal Rye'],
        category: 'Water Conservation & High Biomass',
        waterUseMm: 440,
        waterSensitivity: 0.8,
        droughtResilienceScore: 88,
        nitrogenFixKgHa: 20,
        somBuildRating: 4.6,
        erosionReductionPct: 82,
        marketLiquidityScore: 78,
        equipmentFeasibilityScore: 88,
        bareDaysEliminated: 110,
        netReturnEstimate: '+$65/acre (Saved $110 pumping costs - $45 seed)',
        whySuggested: 'C4 sorghum produces equivalent forage dry matter with 41% less water; winter triticale roots lock down sandy soil against fierce high-desert spring winds.',
        nasaEvidence: 'SMAP confirms subsoil reserves suffice for sorghum without July well over-pumping. GPM data matches triticale germination timing.',
        informationGaps: 'Local dairy acceptance of BMR sorghum forage quality compared to premium leafy alfalfa.',
        localRisksRequiringReview: 'Prussic acid testing required after early autumn frosts before grazing or cutting.'
      },
      {
        id: 'nevada-soil-builder',
        isBaseline: false,
        title: 'Strategy B: Alfalfa Break Crop with Chickpea & Hairy Vetch Relay',
        cropSequence: ['Dryland Chickpea / Field Pea', 'Hairy Vetch / Oats Winter Cover', 'Teff Cash Crop'],
        category: 'Soil Regeneration & Biological Nitrogen',
        waterUseMm: 390,
        waterSensitivity: 0.9,
        droughtResilienceScore: 82,
        nitrogenFixKgHa: 130,
        somBuildRating: 4.8,
        erosionReductionPct: 78,
        marketLiquidityScore: 72,
        equipmentFeasibilityScore: 75,
        bareDaysEliminated: 125,
        netReturnEstimate: '+$85/acre ($120 fertilizer savings + pulse cash sale)',
        whySuggested: 'Breaks long-term alfalfa root disease and weevil cycles; fixes up to 130 kg N/ha of free organic nitrogen before replanting hay.',
        nasaEvidence: 'Landsat NDVI temporal curve proves year-round vegetative ground cover; NASA POWER verifies GDD matches teff maturity window.',
        informationGaps: 'Contract buyer distance for food-grade chickpeas; availability of local seed drill with small legume box.',
        localRisksRequiringReview: 'Careful termination of hairy vetch in spring so it does not pull moisture from the following crop.'
      }
    ];
  } else if (regionId === 'iowa') {
    return [
      {
        id: 'iowa-baseline',
        isBaseline: true,
        title: 'Baseline: Corn-Soybean 2-Year Monoculture',
        cropSequence: ['Grain Corn', 'Fall Tillage', 'Soybean', 'Spring Tillage'],
        category: 'Existing Conventional',
        waterUseMm: 620,
        waterSensitivity: 1.4,
        droughtResilienceScore: 52,
        nitrogenFixKgHa: 45,
        somBuildRating: 2.8,
        erosionReductionPct: 20,
        marketLiquidityScore: 98,
        equipmentFeasibilityScore: 98,
        bareDaysEliminated: 0,
        netReturnEstimate: 'Baseline ($710/acre corn / $530/acre soy)',
        whySuggested: 'Standard Midwestern practice with maximum elevator liquidity, standard crop insurance, and known dealer support.',
        nasaEvidence: 'Landsat 8/9 detects 210 days of unprotected bare soil (NDVI < 0.20) per year. GPM records intense spring thunderstorms causing sheet erosion on bare hills.',
        informationGaps: 'Field-specific tile drainage nitrate export rate into local watershed.',
        localRisksRequiringReview: 'High synthetic nitrogen input bills (~$140/acre); corn rootworm resistance to Bt traits.'
      },
      {
        id: 'iowa-soil-builder',
        isBaseline: false,
        title: 'Strategy A: Corn-Soy with Over-Seeded Winter Cereal Rye',
        cropSequence: ['Corn', 'Winter Rye Cover (Aerial / Drill)', 'Soybean (Planted Green)', 'Rye Roller-Crimper'],
        category: 'Soil Armor & Erosion Protection',
        waterUseMm: 580,
        waterSensitivity: 1.0,
        droughtResilienceScore: 84,
        nitrogenFixKgHa: 50,
        somBuildRating: 4.8,
        erosionReductionPct: 88,
        marketLiquidityScore: 94,
        equipmentFeasibilityScore: 85,
        bareDaysEliminated: 180,
        netReturnEstimate: '+$45/acre (Saved $35 weed spray + soil moisture retention in late summer)',
        whySuggested: 'Cereal rye carpets the soil from November to May, catching spring rains, stopping gully erosion on slopes, and suppressing waterhemp weeds.',
        nasaEvidence: 'SRTM slope analysis identifies high erosion risk on 4.5% hill contours. Landsat confirms rye green-up occurs right during peak April storm runoff.',
        informationGaps: 'Spring rye termination timing during exceptionally dry Aprils to avoid moisture theft.',
        localRisksRequiringReview: 'Adjusting planter down-pressure for planting soybeans green into standing rye residue.'
      },
      {
        id: 'iowa-diversified',
        isBaseline: false,
        title: 'Strategy B: 3-Crop Rotation (Corn → Soybean → Winter Wheat + Red Clover)',
        cropSequence: ['Grain Corn', 'Soybean', 'Winter Wheat', 'Frost-Seeded Red Clover'],
        category: 'Extended Diverse Rotation',
        waterUseMm: 530,
        waterSensitivity: 0.9,
        droughtResilienceScore: 89,
        nitrogenFixKgHa: 110,
        somBuildRating: 5.0,
        erosionReductionPct: 92,
        marketLiquidityScore: 82,
        equipmentFeasibilityScore: 78,
        bareDaysEliminated: 200,
        netReturnEstimate: '+$75/acre ($100 nitrogen credit + wheat straw revenue)',
        whySuggested: 'Re-introduces small grains into the Midwest; red clover fixes 110 kg N/ha, drastically reducing corn fertilizer needs the following year.',
        nasaEvidence: 'SMAP demonstrates balanced seasonal moisture drawdown; NASA POWER confirms sufficient GDD for frost-seeded clover establishment.',
        informationGaps: 'Regional wheat buyer or straw market proximity compared to local corn elevators.',
        localRisksRequiringReview: 'Red clover stand establishment check in late summer if August experiences flash drought.'
      }
    ];
  } else if (regionId === 'california') {
    return [
      {
        id: 'cal-baseline',
        isBaseline: true,
        title: 'Baseline: Continuous Silage Corn & Cotton',
        cropSequence: ['Silage Corn', 'Summer Cotton', 'Deep Tillage Fallow'],
        category: 'Existing High-Water',
        waterUseMm: 780,
        waterSensitivity: 2.1,
        droughtResilienceScore: 32,
        nitrogenFixKgHa: 10,
        somBuildRating: 2.1,
        erosionReductionPct: 25,
        marketLiquidityScore: 90,
        equipmentFeasibilityScore: 92,
        bareDaysEliminated: 0,
        netReturnEstimate: 'Baseline (High gross, but high pumping expense)',
        whySuggested: 'Close proximity to Central Valley mega-dairies and established gin infrastructure.',
        nasaEvidence: 'GRACE gravity anomaly reveals -18.5 cm cumulative groundwater decline. ECOSTRESS highlights extreme LST (>48°C) and water stress on summer fallow.',
        informationGaps: 'SGMA (Sustainable Groundwater Management Act) pumping allocation caps for current water year.',
        localRisksRequiringReview: 'Severe risk of fallowing parcels completely if canal deliveries drop below 20%.'
      },
      {
        id: 'cal-water-saver',
        isBaseline: false,
        title: 'Strategy A: Drought-Tolerant Grain Sorghum + Winter Chickpeas',
        cropSequence: ['BMR Grain Sorghum', 'Winter Chickpea / Blackeye Cowpea', 'Sudangrass Cover'],
        category: 'Water Conservation',
        waterUseMm: 460,
        waterSensitivity: 0.8,
        droughtResilienceScore: 91,
        nitrogenFixKgHa: 75,
        somBuildRating: 4.4,
        erosionReductionPct: 75,
        marketLiquidityScore: 84,
        equipmentFeasibilityScore: 85,
        bareDaysEliminated: 95,
        netReturnEstimate: '+$110/acre (Saved $180 deep-well electrical pumping bills)',
        whySuggested: 'Slashes consumptive irrigation water by 41%, maintaining farm revenue under tight SGMA groundwater allotments.',
        nasaEvidence: 'ECOSTRESS verifies 38% lower daily evapotranspiration; SMAP shows winter chickpeas thrive on winter storm moisture without supplemental pumping.',
        informationGaps: 'Local dairy feed ration adjustment from corn silage to BMR sorghum silage.',
        localRisksRequiringReview: 'Weed control in winter chickpeas without specialized post-emergent herbicides.'
      },
      {
        id: 'cal-regenerative',
        isBaseline: false,
        title: 'Strategy B: Winter Wheat Silage + Relay Cowpeas & Pollinator Strip',
        cropSequence: ['Winter Wheat Silage', 'Cowpea (Blackeye Pea)', 'Mustard Biofumigant'],
        category: 'Biofumigation & Soil Building',
        waterUseMm: 410,
        waterSensitivity: 0.7,
        droughtResilienceScore: 93,
        nitrogenFixKgHa: 95,
        somBuildRating: 4.7,
        erosionReductionPct: 84,
        marketLiquidityScore: 80,
        equipmentFeasibilityScore: 82,
        bareDaysEliminated: 130,
        netReturnEstimate: '+$95/acre ($90 pumping savings + $55 N-fixation - $50 seed)',
        whySuggested: 'Winter wheat utilizes free winter rains; cowpeas fix biological N in summer heat; mustard biofumigant suppresses soil nematodes.',
        nasaEvidence: 'GPM records show 85% of rain coincides with wheat growth. Landsat thermal shows cooler soil under living canopy during June heat waves.',
        informationGaps: 'Optimal mustard incorporation window for peak glucosinolate nematode suppression.',
        localRisksRequiringReview: 'Biofumigant timing requires chopper and immediate roller-packer to seal gases in soil.'
      }
    ];
  } else {
    // High Plains Dryland
    return [
      {
        id: 'plains-baseline',
        isBaseline: true,
        title: 'Baseline: Wheat-Fallow 2-Year Cycle (14-Month Bare Fallow)',
        cropSequence: ['Winter Wheat', 'Chemical Fallow (14 Months Bare)'],
        category: 'Conventional Dryland',
        waterUseMm: 460,
        waterSensitivity: 1.6,
        droughtResilienceScore: 45,
        nitrogenFixKgHa: 0,
        somBuildRating: 1.8,
        erosionReductionPct: 15,
        marketLiquidityScore: 95,
        equipmentFeasibilityScore: 98,
        bareDaysEliminated: 0,
        netReturnEstimate: 'Baseline ($280/acre wheat every 2 years)',
        whySuggested: 'Traditional dryland practice designed to bank 2 years of rain for 1 crop.',
        nasaEvidence: 'ECOSTRESS proves 60% of fallow moisture evaporates into thin air. Landsat records catastrophic bare soil exposure during spring windstorms.',
        informationGaps: 'Subsoil water storage efficiency at 1.5m depth under chemical fallow vs stubble.',
        localRisksRequiringReview: 'High chemical herbicide costs ($45/acre) to keep fallow clean; herbicide-resistant kochia weeds.'
      },
      {
        id: 'plains-intensified',
        isBaseline: false,
        title: 'Strategy A: Wheat → Dryland Corn/Sorghum → Broadleaf Fallow',
        cropSequence: ['Winter Wheat', 'Grain Sorghum (Milo)', 'Broadleaf Cover', 'Summer Cash Crop'],
        category: 'Intensified Opportunity Cropping',
        waterUseMm: 390,
        waterSensitivity: 1.0,
        droughtResilienceScore: 86,
        nitrogenFixKgHa: 30,
        somBuildRating: 4.2,
        erosionReductionPct: 80,
        marketLiquidityScore: 88,
        equipmentFeasibilityScore: 86,
        bareDaysEliminated: 160,
        netReturnEstimate: '+$55/acre (Harvests 2 crops every 3 years instead of 1 every 2 years)',
        whySuggested: 'Eliminates evaporative bare fallow; standing wheat stubble traps winter snow, providing water for drought-hardy grain sorghum.',
        nasaEvidence: 'SMAP confirms standing stubble increases moisture retention by 35 mm compared to bare dirt. NASA POWER confirms adequate GDD for early-maturing sorghum.',
        informationGaps: 'Local grain elevator sorghum drying discount rates in wet autumns.',
        localRisksRequiringReview: 'Must leave high wheat stubble (12+ inches) using stripper header during wheat harvest.'
      },
      {
        id: 'plains-regenerative',
        isBaseline: false,
        title: 'Strategy B: Wheat → Chickpea/Pulse → Sunflower (Deep Taproot)',
        cropSequence: ['Winter Wheat', 'Dryland Chickpea', 'Sunflower (Taproot)', 'Winter Rye'],
        category: 'Diverse Cash & Soil Restructuring',
        waterUseMm: 360,
        waterSensitivity: 0.8,
        droughtResilienceScore: 92,
        nitrogenFixKgHa: 85,
        somBuildRating: 4.8,
        erosionReductionPct: 85,
        marketLiquidityScore: 80,
        equipmentFeasibilityScore: 78,
        bareDaysEliminated: 190,
        netReturnEstimate: '+$78/acre ($80 pulse cash sale + $40 deep fertilizer scavenging)',
        whySuggested: 'Sunflower roots penetrate 2.5m, breaking the tillage hardpan and pulling deep nitrogen that wheat roots could never reach.',
        nasaEvidence: 'SRTM and Landsat show reduction in wind erosion corridors; GPM demonstrates crop cycle matches High Plains rainfall pulses.',
        informationGaps: 'Proximity of confection vs oil sunflower processing plants.',
        localRisksRequiringReview: 'Monitoring sunflower head moth pest pressure with local county extension agent.'
      }
    ];
  }
}

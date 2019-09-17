export const visitDialogText = {
//page 1 Pool-Location
    visitPoolMapped:`
<h3><u>Vernal Pool Location Info</u></h3>
<p>Add a new Visit to an already-mapped Vernal Pool by selecting 'This pool was mapped'.</p>
<p>Once you choose that option, existing pools will be shown on the map at right. Simply click<br>
on a pool on the map to select that pool for your Visit data. Or, if you have the pool's ID<br>
you may enter that value in the 'Pool ID' text box.</p>
<p>Add a new Vernal Pool to the map by selecting 'This pool was unmapped (New Pool)'.</p>
<p>When selected, a moveable marker will appear on the map at right. Move the marker<br>
to the location on the map where the pool is located.</p>`,
    visitPoolId: `
<h3><u>Pool ID</u></h3>
<p>Type a valid Pool ID and press <b><u>Enter</u></b> to search for that pool in the database.<br>
Pool IDs are <em>case-sensitive</em>.</p>
<p>If you don't know the Pool ID, search for it on the map, and click a pool to fill it in.</p>`,
  visitObserverUserName: `
<h3><u>Visit Observer</u></h3>
<p>Enter the username of the person who visited the Pool in the field.</p>
<p>This value can be a VPAtlas user, or the free text name of a person not yet registered in VPAtlas.</p>`,
    visitPoolPhoto: `
<h3><u>Pool Photo</u></h3>
<p>Select a photo of the pool to be uploaded.</p>`,
    visitDate:`
<h3><u>Date</u></h3>
<p>Please enter the date when you recorded information about this pool.</p>
<p>Dates must be in the format 'MM/DD/YYYY'.</p>`,
    visitTown:`
<h3><u>Town</u></h3>
<p>Optionally select a Vermont town from the drop-down list of all Vermont towns.</p>
<p>Town name should be the town where you observed the vernal pool.</p>`,
    visitLocatePool:`
<h3><u>Was the pool located?</u></h3>
<p>If you set out to visit a VPAtlas mapped vernal pool, did you locate that pool?</p>
<p>NOT locating a 'Potential' pool, for example, is valid and useful information.<br>
This would indicated that a Potential pool was non-existent for the date of your visit.</p>`,
    visitCertainty: `
<h3><u>How certain are you that you were in the correct Location?</u></h3>
<p>If you visited a pool that was already mapped in VPAtlas, please describe your<br>
degree of certainty that you found the correct pool.</p>
<p>Please use the VPAtlas map, at right, to review the details of your selected pool<br>
to aid in verifying that you located the pool in question.</p>`,
    visitLocationUncertainty:`
<h3><u>Please estimate the location uncertainty of this pool in yards</u></h3>
<p>Please select a value, in yards, that corresponds to your estimate of how accurately you located this pool. </p>
<p>This can be a guess, or can be based upon the known accuracy of your GPS device, or some other estimation method.</p>`,
    visitNavMethod: `
<h3><u>What navigation method was used?</u></h3>
<p>Please record the method you used to navigate to the pool.</p>
<p></p>`,
    visitDirections:`
<h3><u>Brief directions to pool</u></h3>
<p>Please provide directions to the pool so that others may find it.</p>
<p></p>`,
    visitLocationComments:`
<h3><u>Location Comments</u></h3>
<p>Please provide any additional information or comments about this pool which might be relevant.</p>
<p></p>`,
    visitLocationOfPool: `
<h3><u>Location of Pool</u></h3>
<p>Please do <em>one</em> of the following:</p>
<ol>
  <li>Click on a pool on the map at right. This will auto-fill these Lat/Lon values.</li>
  <li>Enter Lat/Lon coordinates in <em>decimal</em> degrees. Eg. Latitude: 44.764322 Longitude: -72.654222.</li>
</ol>
`,
    visitLatitude: `
<h3><u>Latitude/Northing</u></h3>
<p>Please record the Latitude/Northing value for this pool in <em>decimal</em> degrees. Eg. Latitude: 44.764322.</p>
<p>If you used the VPAtlas map on this page to locate the pool, <em><u><b>do NOT edit this value.</b></u></em></p>
<p>If you navigated to the pool using a GPS and recorded its Latitude, you may enter that value here.</p>
`,
    visitLongitude: `
<h3><u>Longitude/Easting</u></h3>
<p>Please record the Longitude/Easting value for this pool in <em>decimal</em> degrees. Eg. Longitude: -72.654222.</p>
<p>If you used the VPAtlas map on this page to locate the pool, <em><u><b>do NOT edit this value.</b></u></em></p>
<p>If you navigated to the pool using a GPS and recorded its Longitude, you may enter that value here.</p>
`,
    visitCoordSource: `
<h3><u>Source of Pool Coordinates</u></h3>
<p>Please enter the method used to determine the Lat/Lon values for this pool's location.</p>
<p>If you navigated to this pool using a GPS and recorded those coordinates, select 'GPS'.</p>
<p>If you found the pool on a map, then used landmarks or dead-reckoning to locate and visit<br>
the pool, please select the type of map used.</p>
`,

//page 2 Landowner-Info
    visitUserIsLandowner:`
<h3><u>Are you the landowner?</u></h3>
<p>If the pool is located on your land, please check 'Yes'.</p>`,
    visitLandownerPermission:`
<h3><u>Do you have Landowner Permission to map this pool?</u></h3>
<p>If the pool is not located on your land, do you have permission from the landowner to visit the pool?</p>
<p>If so, please check 'Yes'.</p>`,
    visitLandownerName: `
<h3><u>Title</u></h3>
<p>Please provide as much information as you can.</p>`,
    visitLandownerAddress: `
<h3><u>Landowner Address</u></h3>
<p>Please add enough information so that we can contact the landowner if necessary.</p>`,
    visitLandownerPhone: `
<h3><u>Landowner Phone</u></h3>
<p>Please enter either a valid Phone, or a valid Email, or both.</p>`,
    visitLandownerEmail: `
<h3><u>Landowner Email</u></h3>
<p>Please enter either a valid Phone, or a valid Email, or both.</p>`,

//page 3 Field-Verification
    visitVernalPool:`
<h3><u>Is this a Vernal Pool?</u></h3>
<p>Please check 'Yes' if all of the following conditions are met:</p>
<ol>
  <li>The site has no permanent inlet or outlet stream;</li>
  <li>The site does not appear to be a permanent water body;</li>
  <li>The site does not contain fish, and;</li>
  <li></li>
  <ol>
    <li>You visited during the active season (April to August) and detected the eggs, larvae, or adults of at least one of the following indicator species (Wood Frog, Spotted Salamander, Jefferson Salamander, Blue-spotted Salamander, or Fairy Shrimp), OR</li>
    <li>You visited outside the active season, and in your judegment or past experience, the site provides suitable conditions to support one of the indicator species.</li>
  </ol>
</ol>
<p>However, if all these conditions are met, but the site is obviously not adequate habitat for the species present (e.g. eggs laid in skidder ruts or a ditch), check 'No'</p>
<p>If unsure, check 'Don't Know'.<p>`,
    visitPoolType:`
<h3><u>Pool Type</u></h3>
<p>If 'Yes' above, select the type that best describes the habitat context of the pool</p>`,
    visitIsolatedForestDepression:`
<h3><u>Isolated Forest Depression</u></h3>
<p>A typical woodland vernal pool: no permanent hydrologic connection with other wetlands
and the surrounding habitat is >50% forest.</p>`,
    visitFloodplainDepression:`
<h3><u>Floodplain Depression</u></h3>
<p>It appears that the pool may be influenced by floodwaters from an adjacent stream or river at any time of the year.</p>`,
    visitManmadeImpoundmentQuarryEtc:`
<h3><u>Manmade (impoundment, quarry, excavated pond, etc.)</u></h3>
<p>It appears that the pool originated from human activity.</p>`,
    visitIsolatedNonForestDepression:`
<h3><u>Isolated Non-forest Depression</u></h3>
<p>The site has no permanent hydrologic connection with other wetlands and the pool is located in open habitat away from forest edges.</p>`,
    visitPoolAssociatedWithLargerWetlandComplex:`
<h3><u>Pool associated with larger wetland complex</u></h3>
<p>The pool is hydrologically connected to a wetland type other than another vernal pool. If it is connected to another vernal pool, check whichever
box above is appropriate.</p>`,
    visitPoolTypeOther:`
<h3><u>Other</u></h3>
<p>If none of the above, please describe.</p>`,
    visitInletType:`
<h3><u>Inlet Type</u></h3>
<p><u><b>No Inlet</b></u>: There is no evidence of any channelized water entering the pool</p>
<p><u><b>Ephemeral Inlet</b></u>: There is evidence of water entering the pool, but it isn't channelized and doesn't appear to flow continuously.</p>
<p><u><b>Permanent Inlet</b></u>: There is channelized water between well-defined banks continuously running
into the pool. These sites are typically not vernal pools.</p>`,
    visitInletTypeNoInlet:`
<h3><u>No Inlet</u></h3>
<p>There is no evidence of any channelized water entering the pool</p>`,
    visitInletTypeEphermal:`
<h3><u>Ephemeral Inlet</u></h3>
<p>There is evidence of water entering the pool, but it isn't channelized and doesn't appear to flow continuously.</p>`,
    visitInletTypePermanent:`
<h3><u>Permanent Inlet</u></h3>
<p>There is channelized water between well-defined banks continuously running
into the pool. These sites are typically not vernal pools.</p>`,
    visitOutletType:`
<h3><u>Outlet Type</u></h3>
<p><u><b>No Outlet</b></u>: There is no evidence of any channelized water exiting the pool</p>
<p><u><b>Ephemeral Outlet</b></u>: There is evidence of water exiting the pool, but it isn't channelized and
doesn't appear to flow continuously. Many vernal pools, for example, have an overflow outlet
that functions if the water level in the pool reaches a certain level.</p>
<p><u><b>Permanent Outlet</b></u>: There is channelized water between well-defined banks continuously running
out of the pool. These sites are typically not vernal pools.</p>`,
    visitOutletTypeNoOutlet:`
<h3><u>No Outlet</u></h3>
<p>There is no evidence of any channelized water exiting the pool.</p>`,
    visitOutletTypeEphemeral:`
<h3><u>Ephemeral Outlet</u></h3>
<p>There is evidence of water exiting the pool, but it isn't channelized and doesn't appear to flow continuously.
Many vernal pools, for example, have an overflow outlet that functions if the water level in the pool reaches a certain level.</p>`,
    visitOutletTypePermanent:`
<h3><u>Permanent Outlet</u></h3>
<p>There is channelized water between well-defined banks continuously running out of the pool.
These sites are typically not vernal pools.</p>`,
    visitSurroundingHabitat:`
<h3><u>Surrounding Habitat</u></h3>
<p>From the following options, select all those that apply to best describe the habitat within 250 feet of the pool.</p>`,
    visitForestUpland:`
<h3><u>ForestUpland</u></h3>
<p>Select the one that best describes the forest cover type surrounding the pool.</p>`,
    visitForestCondition:`
<h3><u>Forest Condition</u></h3>
<p><b><u>Undisturbed</u></b>: No evidence of logging within 250-feet of the pool OR logging took place far enough
in the past that the site has, for all practical purposes, recovered.</p>
<p><b><u>Minor logging</u></b>: There is evidence of thinning cuts which have left =70% of the canopy intact.</p>
<p><b><u>Major logging</u></b>: There is evidence of aggressive thinning or clearcut logging leaving <70% of the canopy intact.
Be careful to distinguish between logging activity (flat-topped stumps) and natural disturbances
(such as wind-throw and ice storms) that can leave canopy gaps.</p>`,
    visitForestConditionUndisturbed:`
<h3><u>Undisturbed</u></h3>
<p>No evidence of logging within 250-feet of the pool OR logging took place far enough
 in the past that the site has, for all practical purposes, recovered.</p>`,
    visitForestConditionMinorLogging:`
<h3><u>Minor logging</u></h3>
<p>There is evidence of thinning cuts which have left =70% of the canopy intact.</p>`,
    visitForestConditionMajorLogging:`
<h3><u>Major logging</u></h3>
<p>There is evidence of aggressive thinning or clearcut logging leaving <70% of the canopy intact.
Be careful to distinguish between logging activity (flat-topped stumps) and natural disturbances
(such as wind-throw and ice storms) that can leave canopy gaps.</p>`,
    visitHabitatLightDev:`
<h3><u>Title</u></h3>
<p>Content paragraph...</p>
<p>Content paragraph...</p>`,
    visitHabitatHeavyDev:`
<h3><u>Title</u></h3>
<p>Content paragraph...</p>
<p>Content paragraph...</p>`,
    visitHabitatPavedRd:`
<h3><u>Title</u></h3>
<p>Content paragraph...</p>
<p>Content paragraph...</p>`,
    visitHabitatDirtRd:`
<h3><u>Title</u></h3>
<p>Content paragraph...</p>
<p>Content paragraph...</p>`,
    visitHabitatPowerline:`
<h3><u>Title</u></h3>
<p>Content paragraph...</p>
<p>Content paragraph...</p>`,
    visitHabitatOther:`
<h3><u>Title</u></h3>
<p>Content paragraph...</p>
<p>Content paragraph...</p>`,
    visitHabitatComment:`
<h3><u>Title</u></h3>
<p>Content paragraph...</p>
<p>Content paragraph...</p>`,

//page 4 Pool-Characteristics
    visitMaxDepth: `
<h3><u>Approximate Maximum Pool Depth</u></h3>
<p>This is an approximate depth at the deepest part of the pool (typically the center). Feel free
to use a stick or other measuring device instead of wading into the deepest part. In most cases, an
estimate from the pool edge will suffice.</p>`,
    visitWaterLevelObs: `
<h3><u>Water Level at Time of Survey</u></h3>
<p>In order to estimate this, examine the edges of the pool for signs of high water,
including water-stained leaves, sediment deposits on the leaf litter, and water marks on tree trunks.</p>`,
    visitHydroPeriod: `
<h3><u>Hydro Period</u></h3>
<p><b><u>Permanent</u></b>: Check this box for sites (like ponds) that appear to retain water throughout the year.</p>
<p><b><u>Semi-permanent</u></b>: Check this box for sites that appear to retain at least some water in most years. These sites may dry
completely, but only in drought years.</p>
<p><b><u>Ephemeral</u></b>: Check this box for sites that appear to dry completely most years. Most 'typical' vernal pools fall
into this category.</p>`,
    visitHydroPeriodPermanent: `
<h3><u>Permanent</u></h3>
<p>Check this box for sites (like ponds) that appear to retain water throughout the year.</p>`,
    visitHydroPeriodSemiPermanent: `
<h3><u>Semi-permanent</u></h3>
<p>Check this box for sites that appear to retain at least some water in most years. These sites may dry
completely, but only in drought years.</p>`,
    visitHydroPeriodEphemeral: `
<h3><u>Ephemeral</u></h3>
<p>Check this box for sites that appear to dry completely most years. Most 'typical' vernal pools fall into this category.</p>`,
    visitApproxSizeofPool: `
<h3><u>Approximate size of pool (at maximum capacity):</u></h3>
<p>While use of a measuring tape to obtain the dimensions is preferable, pacing or estimating the dimensions are also acceptable.</p>
<p>To obtain these measurements when the pool is not completely full, examine the immediate pool basin
for evidence of high water marks. Signs include water-stained leaves, sediment deposits on the leaf litter,
and water marks on tree trunks.</p>`,
    visitMaxLength: `
<h3><u>Title</u></h3>
<p>Content paragraph...</p>
<p>Content paragraph...</p>`,
    visitVegetation: `
<h3><u>Vegetation</u></h3>
<p>Estimate the percentage of the pool that is occupied by the different types of vegetation. More than
one vegetation type can be filled in and the sum of the percentages can exceed 100%.</p>`,
    visitPoolShrubs: `
<h3><u>Title</u></h3>
<p>Content paragraph...</p>
<p>Content paragraph...</p>`,
    visitPoolEmergents: `
<h3><u>Title</u></h3>
<p>Content paragraph...</p>
<p>Content paragraph...</p>`,
    visitPoolFloatingVeg: `
<h3><u>Title</u></h3>
<p>Content paragraph...</p>
<p>Content paragraph...</p>`,
    visitSubstrate: `
<h3><u>Substrate</u></h3>
<p>Check the one appropriate box for the dominant substrate present in the pool.</p>`,
    visitSubstrateOther: `
<h3><u>Title</u></h3>
<p>Content paragraph...</p>
<p>Content paragraph...</p>`,
    visitDisturbance: `
<h3><u>Disturbance</u></h3>
<p>Check all forms of disturbance that have affected the pool.</p>`,
    visitDisturbSiltation: `
<h3><u>Title</u></h3>
<p>Content paragraph...</p>
<p>Content paragraph...</p>`,
    visitDisturbVehicleRuts: `
<h3><u>Title</u></h3>
<p>Content paragraph...</p>
<p>Content paragraph...</p>`,
    visitDisturbRunoff: `
<h3><u>Title</u></h3>
<p>Content paragraph...</p>
<p>Content paragraph...</p>`,
    visitDisturbDitching: `
<h3><u>Title</u></h3>
<p>Content paragraph...</p>
<p>Content paragraph...</p>`,
    visitDisturbOther: `
<h3><u>Title</u></h3>
<p>Content paragraph...</p>
<p>Content paragraph...</p>`,

//page 5 Indicator-Species
    visitSpeciesObserved: `
<h3><u>Indicator Species Observed</u></h3>
<p>Use amphibian identification aids
<a target="_blank" href="https://vtecostudies.org/projects/forests/vernal-pool-conservation/vermont-vernal-pool-mapping-project/volunteer-materials/">
found here
</a> to help identify the indicator species using the pool.</p>
<p>Presence of other amphibian species (such as Eastern Newt or Green Frog) are also noteworthy and should be
included in the 'Other' row.</p>`,
    visitAdults: `
<h3><u>Adults</u></h3>
<p>
Please enter the approximate number of adults observed for the amphibians (frogs and salamanders) present.
</p>
<p>
For invertebrates such as fingernail clams and fairy shrimp, mark an 'X' in this column to indicate species present.
</p>`,
    visitTadpolesLarvae: `
<h3><u>Tadpoles/Larvae</u></h3>
<p>Mark an 'X' in this column to indicate the presence of tadpoles or larvae of each species present.</p>`,
    visitEggMassNumber: `
<h3><u>Egg Mass Number</u></h3>
<p>Please enter the number of egg masses (not individual embryos) of each species present in the pool.</p>
<p>Use the dropdown menu in the next column to indicate if the number entered was derived from an actual
count or an estimate.</p>`,
    visitEggMassMethod: `
<h3><u>Egg Mass Method</u></h3>
<p>Please use this dropdown menu to indicate if the Egg Mass Number entered in the previous column was derived from
an actual count or an estimate.</p>`,
    visitPhotoUpload: `
<h3><u>Photo Upload</u></h3>
<p>Please upload a photograph of the entire pool AND photographs of each indicator species present
(egg masses, tadpoles, metamorphs or adults).</p>`,
    visitSpeciesNotes: `
<h3><u>Indicator Species Notes</u></h3>
<p>Use this column to enter any comments on the species present or the Photo ID#s. Please name each photograph
using the following protocol:</p>
<p>Pool ID_Your Initials_Picture #.</p>
<p>For example: SDF34_JD_1. This will allow us to link each photograph with the appropriate pool data form.</p>`,
visitFish: `
<h3><u>Were Fish Observed?</u></h3>
<p>Please indicate whether you observed any fish in the pool.</p>`,
visitFishCount: `
<h3><u>How Many Fish?</u></h3>
<p>Please select the value that indicates how many fish were observed.</p>`
};

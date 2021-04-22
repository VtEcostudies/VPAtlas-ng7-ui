export const surveyDialogText = {

surveySearch:`
<h3><u>Search Vernal Pool Reviews</u></h3>
<p>Get a complete list of all Reviews of Vernal Pool Visits.</p>
<p>Limit the list by entering search terms.</p>
`,
surveyId:`
<h3><u>Vernal Pool Review ID</u></h3>
<p>This value is generated internally by VPAtlas to track Vernal Pool Reviews.</p>
`,
surveyUserName:`
<h3><u>Vernal Pool Review User Name</u></h3>
<p>Review User Name is the name of person who created the Review.</p>
<p>This is not necessarily the same as the Review QA Person, the individual responsible for the actual Review of
Vernal Pool data.</p>
`,
surveyVisitId:`
<h3><u>Vernal Pool Review Visit ID</u></h3>
<p>The Visit ID being Reviewed. In VPAtlas, a ground-confirmed Vernal Pool data-gathering event is called a 'Visit'.</p>
<p></p>
`,
surveyPoolId:`
<h3><u>Vernal Pool Review Pool ID</u></h3>
<p>The Pool ID of the Vernal Pool that was Visited, which is being Reviewed.</p>
`,
surveyQADate:`
<h3><u>Vernal Pool Review QA Date</u></h3>
<p>The date of the actual Vernal Pool Review.</p>
`,
surveyQACode: `<h3><u>Review QA Code</u></h3>
<p>One of the following QA Codes should be assigned during survey. These Codes may or may not be the same as Pool Status Code.</p>
<ul>
<li>CONF- (Confirmed Pool). Assigned when an entry confirmed presence of a vernal pool and was deemed complete and accurate.
</li>
<li>PROB-VPMP- (Probable Pool). Assigned when an entry was inconclusive or incomplete, but indicated the likely presence of a vernal pool. Typically used for pools visited during off-season, or those with questionable hydroperiod due to field conditions.
</li>
<li>PROB-OTHER- (Probable from other source). This was not assigned during QA of new database entries, but indicates pool information provided by other sources assumed reliable during the original mapping process. In these entries, the VPMP data form has not been completed.
</li>
<li>NOT FOUND- (Pool not found at location). The pool was not located at the location anticipated. This typically resulted from a remote mapping error such as tree shadow, ledge, or other confusing photo signature.
</li>
<li>NOT POOL- (Location holds a feature that is not a vernal pool). Assigned when a field investigation and QA survey determined the site was not a classic vernal pool, even if it had amphibian breeding habitat and indicator species, such as a seepage wetland.
</li>
<li>DUPLICATE- (Duplicate data entry) Assigned when multiple database entries are made for a single pool location. One of the duplicate entries received another QA_Code, and all others received are coded “DUPLICATE”
</li>
<li>LANDOWNER- (Landowner restrictions on data distribution). Assigned when a landowner specifically requested that information on a pool on their property NOT be made public, OR when an observer has not acquired landowner permission to visit a pool. For the purposes of data distribution, these pools are not considered “Confirmed”, and should remain "Probable."
</li>
<li>ERROR- (Data entry error). Assigned when QA survey is unable to determine the appropriate code from the list above. Typically used with incomplete or very inconsistent entries without sufficient explanation
</li>
</ul>
`,
surveyQAAlt: `<h3><u>Review QA Alt</u></h3><p>Used for additional and/or temporary notations during the QA process</p>`,
surveyQAPerson: `<h3><u>Review QA Person</u></h3><p>Identification of the QA surveyer.</p>`,
surveyQANotes: `<h3><u>Review QA Notes</u></h3><p>Notes about QA survey, justification for QA_CODE, changes made and outstanding issues encountered during the QA survey</p>`
};

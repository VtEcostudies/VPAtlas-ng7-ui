export const poolsDialogText = {

  radioSearch:`
  <h3><u>Vernal Pool Atlas - Radio Buttons</u></h3>
  <p>Use the radio buttons to filter which pools are displayed.</p>
  <ul>
  <li>All Pools: Potential, Probable, and Confirmed Vernal Pools.</li>
  <li>My Data: All pools to which you have contributed data, both mapping and visits. You must be a
  registered VPAtlas user and be logged-in to see this option.</li>
  <li>Monitored: (Not implemented yet.) Coming soon: the ability to view pools that are
  part of the Vernal Pool Monitoring Project!</li>
  </ul>
  <p>On the map, you will also see a menu of check boxes allowing you to show/hide pools by status:</p>
  <ul>
  <li>Potential: Might be Vernal Pools; awaiting data from a field visit.</li>
  <li>Probable: Probable Vernal Pools; need more information to determine status</li>
  <li>Confirmed: Confirmed Vernal Pools; pools that have been verified by at least one field visit, and a QA/QC review by a VPAtlas administrator.</li>
  </ul>
  `,
  searchFilters:`
  <h3><u>Search Pools/Visits</u></h3>
  <p>
  You can further refine your Vernal Pool search by entering a Pool ID, a Username,
  a Town, or a Mapped Method.</p>
  <p>Note: radio buttons, multiple search terms can be combined to filter pools
  by multiple criteria. Further refine the view using the pool status checkboxes
  on the map.</p>
  <ul>
    <li>Pool ID: The value must be an exact match. Values are case-sensitive.</li>
    <li>User: Enter a username to see only pools where a user has contributed data.</li>
    <li>Town: Enter a town name to see pools in a town. Partial matches allowed. NOTE: This search criteria will only display pools that have been visited in the field.</li>
    <li>Method: Select an option to see pools that were discovered by a specific mapping method.</li>
  </ul>
  `,
  recordCount:`
  <h3><u>Records and Record Counts/Stats</u></h3>
  <p>
  The Number of records displayed depends upon the view:
  </p>
  <ul>
    <li>Radio Buttons: counts are the number of *Pools* displayed on the map.
    <li>Table View: counts are for all records, including multiple Visits per pool. For example,
    if a pool has 3 visits, Record Counts in Table View will be 3. In Map View, it will be 1.
    </li>
  </ul>
  `,
  loadAll:`
  <h3><u>Load All Check Box</u></h3>
  <p>
  Load all data at once, or paginate data. The Map View is fast enough to load all data at once.
  </p>
  <p>
  The Table View is slower, especially when attempting to display nearly 5000 rows of data. Try
  filtering results first, then Load All in Table View, if you want to see all records at once.
  </p>
  `
}

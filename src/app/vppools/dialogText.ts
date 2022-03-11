export const poolsDialogText = {

  radioSearch:`
  <h3><u>Vernal Pool Atlas - Radio Buttons</u></h3>
  <p>Use the radio buttons to filter which pools are displayed.</p>
  <ul>
  <li>All Pools: Potential, Probable, and Confirmed Vernal Pools.</li>
  <li>My Data: All pools to which you have contributed data, both mapping and visits. You must be a
  registered VPAtlas user and be logged-in to see this option.</li>
  <li>Monitored: Pools that are part of the Vernal Pool Monitoring Project</li>
  </ul>
  <p>On the map, you will also see a menu of check boxes allowing you to show/hide pools by status:</p>
  <ul>
  <li>Potential: Might be Vernal Pools; awaiting data from a field visit.</li>
  <li>Probable: Probable Vernal Pools; need more information to determine status.</li>
  <li>Confirmed: Confirmed Vernal Pools; pools that have been verified by at least one field visit, and a QA/QC review by a VPAtlas administrator.</li>
  </ul>
  `,
  searchFilters:`
  <h3><u>Search Pools/Visits</u></h3>
  <p>
  You can further refine your Vernal Pool search by entering a Pool ID, a Username,
  a Town, or a Mapped Method.</p>
  <p>Note: radio buttons can be combined with multiple search terms to filter pools
  by multiple criteria. Further refine the view using the pool status checkboxes
  on the map.</p>
  <ul>
    <li>Pool ID: The value must be an exact match. Values are case-sensitive.</li>
    <li>Town: Select a town name to see pools in (or Zoom to) a town.</li>
    <li>User: Enter a username to see only pools where a user has contributed data.</li>
  </ul>
  `,
  zoomFilter:`
  <h3><u>Zoom Only</u></h3>
  <p>Check this box to use the search filters to Zoom to a Pool ID or Town.</p>
  <p>Un-check this box to use search filters to limit data shown on the map and list views.</p>
  <ul>
    <li>Pool ID: The value must be an exact match. Values are case-sensitive.</li>
    <li>Town: Select a town name to see pools in (or Zoom to) a town.</li>
    <li>User: Enter a username to see only pools where a user has contributed data.</li>
  </ul>
  `,
  recordCount:`
  <h3><u>Records and Record Counts/Stats</u></h3>
  <p>
  The Number of records displayed depends upon the view:
  </p>
  <ul>
    <li>Radio Buttons: counts are the number of pools displayed on the map.</li>
    <li>Records: a count of all records, including multiple visits per pool. For example,
    if a pool has 3 visits, 'Records' will show a value of 3, while the pool-count will be 1.</li>
  </ul>
  `,
  mapViewTableView:`
  <h3><u>Map View / Table View</u></h3>
  <p>
  Map View vs. Table View
  </p>
  <ul>
    <li>Map View: the map shows one 'point' per pool, which represents all data
    associated with a pool - a mapping event, any visits to the pool, monitoring events, and more.
    Map View is simplified.
    </li>
    <li>
    Table View: For a more complete picture of the data for a pool, switch to Table View. In Table View,
    you will see multiple rows for a Pool ID if there are multiple Visits to the pool.
    </li>
  </ul>
  `,
  loadAll:`
  <h3><u>Load All Check Box</u></h3>
  <p>
  Load all data at once, or paginate data. The Map View is fast enough to load all data at once.
  </p>
  <p>
  The Table View is slower, especially when attempting to display nearly 5000 rows of data.
  If you want to see all records at once, try filtering results first, then Load All in Table View.
  </p>
  `
}

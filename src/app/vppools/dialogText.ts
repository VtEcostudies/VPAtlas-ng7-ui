import { environment } from '@environments/environment';
const uiHost = environment.uiHost;

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
  a Town, or by checking 'Indicator Species'.</p>
  <p>Note: radio buttons can be combined with multiple search terms to filter pools
  by multiple criteria. Further refine the view using the pool status checkboxes
  on the map.</p>
  <ul>
    <li>Pool ID: The value must be an exact match. Values are case-sensitive.</li>
    <li>Town: Select a town name to see pools in (or Zoom to) a town.</li>
    <li>User: Enter a username to see only pools where a user has contributed data.</li>
    <li>Indicator Species: Check the box to see only pools where indicator species were observed.</li>
  </ul>
  <p>
  Note: if you type quickly, the drop-down list of Towns behaves like an auto-complete field, allowing
  you to enter multiple letters and match a Town Name exactly.
  </p>
  <p>
  Note: you can create a packaged URL to show filtered Vernal Pool data using query parameters. For example:
  <ul>
    <li><a href="${uiHost}/pools/list?poolId=NEW100&zoomFilter=false">
        Pool ID NEW100.
        </a></li>
    <li><a href="${uiHost}/pools/list?townName=Brunswick&zoomFilter=false">
        All vernal pools in the town of Brunswick.
        </a></li>
    <li><a href="${uiHost}/pools/list?townName=fair haven&zoomFilter=false&hasIndicators=true&loadAllRec=true&mapView=false">
        Vernal pools with indicator species in the town of Fair Haven. Show the table view.
        </a></li>
    <li><a href="${uiHost}/pools/list?poolDataType=Visited&hasIndicators=true&zoomFilter=false&loadAllRec=true&mapView=false">
        Visited pools having indicator species. Show the table view.
        </a></li>
    <li><a href="${uiHost}/pools/list?poolDataType=Monitored&townName=Randolph&zoomFilter=false">
        Monitored pools in the town of Randolph.
        </a></li>
    <li><a href="${uiHost}/pools/list?poolDataType=Monitored&userName=kevtolan">
        Monitored pools associeated with user 'kevtolan'.
        </a></li>

  </ul>
  </p>
  `,
  zoomFilter:`
  <h3><u>Zoom Only</u></h3>
  <p>Check this box to use search filters to Zoom to a <u>Pool ID or Town</u>.</p>
  <p>
  Un-check this box to use search filters to limit data shown on the map and in the tabular view to just your search criteria.
  </p>
  <p>
  This selection has no effect on User and Species filters, which will always filter pools shown.
  </p>
  <ul>
    <li>Pool ID: The value must be an exact match. Values are case-sensitive.</li>
    <li>Town: Select a town name to see pools in (or Zoom to) a town.</li>
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

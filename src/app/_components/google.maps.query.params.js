Query Translation
q=  “q” stands for “query” and anything passed in this parameter is treated as if it had been typed into the query box on the maps.google.com page.
EX.
http://maps.google.com/?q=New+York
near=   “near” can be used as the location part of a query instead of putting the entire string into q=. Also needed/useful for disambiguation.
EX.
http://maps.google.com/?q=shelton;near=new+york
http://maps.google.com/?q=shelton;near=seattle
g=  “g” is an address or location that provides extra context for the “q” parameter. Google Maps stores the last run search here, but if it is the first search it can only contain your starting location. This is a potential information leak, so make sure you do actually mean to share the content of this parameter.
mrt=    “mrt” specifies a type of search. The default is blank, which searches for everything. Other options are:
mrt=yp  –  Yellow pages
mrt=realestate — real estate listings
mrt=ds — Related maps
mrt=websearch  — local web pages (synonym for ‘yp’ ?)
mrt=loc — Locations search
Many uses will require the ‘q’ option and/or the ‘near’ option
EX.
http://maps.google.com/?q=phoenix&mrt=yp&near=tempe
start=  “start” skips the first (start-1) matches.
num=    “num” displays, at most, the given number of matches. The valid range is 0 to 20.
ll= “ll” stands for Latitude,longitude of a Google Map center – Note that the order has to be latitude first, then longitude and it has to be in decimal format.
sll=    “sll” Latitude,longitude of the point from which the business search should be performed.
spn=    “spn” Approximate lat/long span. The zoom level will be adjusted to fit if there’s no z= parameter.
latlng= “latlng” takes three numbers separated by commas. The first two numbers (presumably representing latitude and longitude multiplied by 1000000) are ignored. The third number seems to be a Google internal “Company ID” number for a particular business.
cid=    “cid” is similar to “latlng,” but generating a different map size. It takes three numbers separated by commas. The first two numbers (presumably representing latitude and longitude multiplied by 1000000) are ignored. The third number seems to be a Google internal “Company ID” number for a particular business.
geocode=    “geocode” is a concatination of “geocode” encoded values for waypoints used in directions.
radius= “radius” localizes results to a certain radius. Requires “sll” or similar center point to work.
t=  “t” is Map Type. The available options are “m” map, “k” satellite, “h” hybrid, “p” terrain.
z=  “z” sets the zoom level.
layer=  “layer” Activates overlay. Current option is “t” traffic.
lci=    “lci” activates layers of tiles and needs to be comma-separated.
view=   “view” can be used to select text view (view=text) or the normal map view (view=map).
saddr=  “saddr” source address. Use this when asking for driving directions.
daddr=  “daddr” Destination address(es). Use this when asking for driving directions.
mrad=   “mrad” gives you additional destination address.
dirflg= “dirflg” is the route type: dirflg=h Switches on “Avoid Highways” route finding mode. dirflg=t Switches on “Avoid Tolls” route finding mode. dirflg=r Switches on “Public Transit” – only works in some areas. dirflg=w Switches to walking directions – still in beta.
via=    “via” gives a comma separated list of intermediate addresses for directions, that should be ‘via points’.
doflg=  “doflg” Distance Units. (Defaults to prevalent units in country of origin.) doflg=ptk outputs directions in metric (km) and doflg=ptm outputs directions in imperial (miles).
cbll=   “cbll” is latitude,longitude for Street View.
cbp=    “cbp” Street View window that accepts 5 parameters: 1) Street View/map arrangement, 11=upper half Street View and lower half map, 12=mostly Street View with corner map 2) Rotation angle/bearing (in degrees) 3) Tilt angle, -90 (straight up) to 90 (straight down) 4) Zoom level, 0-2 5) Pitch (in degrees) -90 (straight up) to 90 (straight down), default 5
panoid= “panoid” is the panorama ID, which is the ID of the current nearby panorama object in Street View.
hl= “hl” stands for “host language”.
om= “om” stands for “overview map.” The presence of this parameter with a value other than 1 causes the overview map to be closed. If the parameter is omitted, or present with the value 1, then the overview map is open.
ie= “ie” stands for “input encoding” and can be used to specify the input character encoding set.
oe= “oe” stands for “output encoding” and can be used to specify the input character encoding set.
output= “output” is for output format (blank is default).
f=  “f” stands for “form” and controls the style of query form to be displayed. f=d Displays the “directions” form (two input boxes: from, to). f=l Displays the “local” form (two input boxes: what, where). f=q (or no parameter) The default search form is displayed (single input).
pw= “pw” stands for “print window.” It activates the print mode and initiates printing. Example, pw=2.
iwloc=  “iwloc” stands for “info window location” and specifies where the infowindow will be displayed. In a business search iwloc=A to iwloc=J will open the info window over the corresponding business marker, and iwloc=near will place it over the big green arrow if that’s currently displayed. iwloc=addr can be used on map search to explicitly request the info window to be open on the address, but that’s the default anyway. Directions search supports iwloc=start, iwloc=end and iwloc=pause1
iwd=1   “iwd” stands for “info window display” and specifies that the infowindow displayed (iwloc=) will be a detailed (expanded) view.
iwstate1=   iwstate1=ssaddfeatureinstructioncard Specifies that the infowindow is in add place mode. Use with ssp=addf and iwloc=SS.  iwstate1=sscorrectthiscard Specifies the infowindow is in edit mode. iwstate1=sscorrectthiscard:ssmovemarkercard The infowindow is in Move marker mode, with the marker bouncing and draggable. iwstate1=sscorrectthiscard:ssedithistorycard The infowindow is in View history mode, displaying a graphical list of marker moves.
msa=    “msa” is involved in My Maps processing. It does nothing without the “/ms” and “/ms” does nothing without the msa=. msa=0 Used with msid= to show a particular My Map.
msa=b Activates the “My Maps” sidebar when used in conjunction with “maps.google.com/ms”.  msa=1 shows the My Maps tab directly (like msa=b did). msa=2 Jumps directly to create new My Map form.
msid=   “msid” specifies a My Maps identifier. When used in conjunction with “maps.google.com/ms” and msa=0, the corresponding My Map is displayed.
vp= “vp” stands for “view point” and the presence of this parameter causes maps.google.com to switch into Copyright Service mode. Instead of returning the html that draws a map, it returns information about the copyright ownership in Javascript format. The vp= parameter specifies the viewpoint (i.e. the centre of the map). Copyright Service only works when the spn= and z= parameters are also supplied, indicating the span and the zoom. Optional parameters are t=, which specifies the map type, and key= which specifies the API key of the site performing the request.
sspn=   “sspn” stands for “Screen span”. Map bounds dimensions in Degrees, to calculate this use:newGLatLng(map.getBounds().getNorthEast().lat() - map.getBounds().getSouthWest().lat(),map.getBounds().getNorthEast().lng() - map.getBounds().getSouthWest().lng()).toUrlValue()

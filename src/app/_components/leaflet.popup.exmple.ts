import 'leaflet';
declare let L;
import './main.scss';
import "reflect-metadata";
import "zone.js/dist/zone";
import "zone.js/dist/long-stack-trace-zone";
import { BrowserModule } from "@angular/platform-browser";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { Component, NgModule, ComponentRef, Injector, ApplicationRef, ComponentFactoryResolver, Injectable, NgZone } from "@angular/core";

// ###########################################
// App component
// ###########################################
@Component({
    selector: "app",
    template: `<section class="app"><map></map></section>`
})
class AppComponent { }

// ###########################################
// Popup component
// ###########################################
@Component({
    selector: "popup",
    template: `<section class="popup">Popup Component! :D {{ param }}</section>`
})
class PopupComponent { }

// ###########################################
// Leaflet map service
// ###########################################
@Injectable()
class MapService {

    map: any;
    baseMaps: any;
    markersLayer: any;

    public injector: Injector;
    public appRef: ApplicationRef;
    public resolver: ComponentFactoryResolver;
    public compRef: any;
    public component: any;

    counter: number;

    init(selector) {
        this.baseMaps = {
            CartoDB: L.tileLayer("http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
            })
        };
        L.Icon.Default.imagePath = '.';
        L.Icon.Default.mergeOptions({
            iconUrl: require('leaflet/dist/images/marker-icon.png'),
            shadowUrl: require('leaflet/dist/images/marker-shadow.png')
        });
        this.map = L.map(selector);
        this.baseMaps.CartoDB.addTo(this.map);
        this.map.setView([51.505, -0.09], 13);

        this.markersLayer = new L.FeatureGroup(null);
        this.markersLayer.clearLayers();
        this.markersLayer.addTo(this.map);
    }

    addMarker() {
        var m = L.marker([51.510, -0.09]);
        m.bindTooltip('Angular 4 marker (PopupComponent)');
        m.bindPopup(null);
        m.on('click', (e) => {
            if (this.compRef) this.compRef.destroy();
            const compFactory = this.resolver.resolveComponentFactory(this.component);
            this.compRef = compFactory.create(this.injector);

            this.compRef.instance.param = 0;
            setInterval(() => this.compRef.instance.param++, 1000);

            this.appRef.attachView(this.compRef.hostView);
            this.compRef.onDestroy(() => {
                this.appRef.detachView(this.compRef.hostView);
            });
            let div = document.createElement('div');
            div.appendChild(this.compRef.location.nativeElement);
            m.setPopupContent(div);
        });
        this.markersLayer.addLayer(m);
        return m;
    }
}

// ###########################################
// Map component. These imports must be made
// here, they can't be in a service as they
// seem to depend on being loaded inside a
// component.
// ###########################################
@Component({
    selector: "map",
    template: `<section class="map"><div id="map"></div></section>`,
})
class MapComponent {

    marker: any;
    compRef: ComponentRef<PopupComponent>;

    constructor(
        private mapService: MapService,
        private injector: Injector,
        private appRef: ApplicationRef,
        private resolver: ComponentFactoryResolver
    ) { }

    ngOnInit() {
        this.mapService.init('map');
        this.mapService.component = PopupComponent;
        this.mapService.appRef = this.appRef;
        this.mapService.compRef = this.compRef;
        this.mapService.injector = this.injector;
        this.mapService.resolver = this.resolver;
        this.marker = this.mapService.addMarker();
    }
}

// ###########################################
// Main module
// ###########################################
@NgModule({
    imports: [
        BrowserModule
    ],
    providers: [
        MapService
    ],
    declarations: [
        AppComponent,
        MapComponent,
        PopupComponent
    ],
    entryComponents: [
        PopupComponent
    ],
    bootstrap: [AppComponent]
})
class AppModule { }

platformBrowserDynamic().bootstrapModule(AppModule);

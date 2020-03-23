import '../polyfills';

import wdfnviz from 'wdfn-viz';

// Load misc Javascript helpers for general page interactivity.
import {register} from '../helpers';
register();

import {configureStore} from './network-store';
import {getParamString} from '../url-params';

import {attachToNode as NetworkMapComponent} from './components';

const COMPONENTS = {
    'network-map': NetworkMapComponent
};

const load = function () {
    let nodes = document.getElementsByClassName('wdfn-component');
    let store = configureStore({
        ui: {
            windowWidth: window.innerWidth
        }
    });
    for (let node of nodes) {
        // If options is specified on the node, expect it to be a JSON string.
        // Otherwise, use the dataset attributes as the component options.
        const options = node.dataset.options ? JSON.parse(node.dataset.options) : node.dataset;
        const hashOptions = Object.fromEntries(new window.URLSearchParams(getParamString()));
        COMPONENTS[node.dataset.component](store, node, Object.assign({}, options, hashOptions));
    }


};

wdfnviz.main(load);



// Leaflet expects an exports global to exist - so although we don't use this,
// just set it to something so it's not undefined.
export var dummy = true;
declare module "*.svelte" {
    import type { Component } from "svelte";
    // This tells TS: "Every .svelte file is a Svelte 5 Component"
    const component: Component<any, any, any>;
    export default component;
}
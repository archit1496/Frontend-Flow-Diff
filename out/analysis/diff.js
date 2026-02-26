"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeBehavioralDiff = computeBehavioralDiff;
function routeKey(r) {
    return `${r.kind}:${r.path}`;
}
function apiKey(a) {
    return `${a.method}:${a.path}`;
}
function textKey(t) {
    return t.key ?? t.text.slice(0, 50);
}
function stateKey(s) {
    return s.condition;
}
function computeBehavioralDiff(before, after) {
    const routesBefore = new Map(before.routes.map((r) => [routeKey(r), r]));
    const routesAfter = new Map(after.routes.map((r) => [routeKey(r), r]));
    const apiBefore = new Map(before.apiCalls.map((a) => [apiKey(a), a]));
    const apiAfter = new Map(after.apiCalls.map((a) => [apiKey(a), a]));
    const textsBefore = new Map(before.uiTexts.map((t) => [textKey(t), t]));
    const textsAfter = new Map(after.uiTexts.map((t) => [textKey(t), t]));
    const statesBefore = new Map(before.guardedStates.map((s) => [stateKey(s), s]));
    const statesAfter = new Map(after.guardedStates.map((s) => [stateKey(s), s]));
    const routeAdded = [];
    const routeRemoved = [];
    const routeChanged = [];
    routesAfter.forEach((r, k) => {
        const b = routesBefore.get(k);
        if (!b)
            routeAdded.push(r);
        else if (b.path !== r.path || b.raw !== r.raw)
            routeChanged.push({ before: b, after: r });
    });
    routesBefore.forEach((r, k) => {
        if (!routesAfter.has(k))
            routeRemoved.push(r);
    });
    const apiAdded = [];
    const apiRemoved = [];
    const apiChanged = [];
    apiAfter.forEach((a, k) => {
        const b = apiBefore.get(k);
        if (!b)
            apiAdded.push(a);
        else if (b.path !== a.path || b.method !== a.method)
            apiChanged.push({ before: b, after: a });
    });
    apiBefore.forEach((a, k) => {
        if (!apiAfter.has(k))
            apiRemoved.push(a);
    });
    const stateAdded = [];
    const stateRemoved = [];
    const stateChanged = [];
    statesAfter.forEach((s, k) => {
        const b = statesBefore.get(k);
        if (!b)
            stateAdded.push(s);
        else if (b.condition !== s.condition)
            stateChanged.push({ before: b, after: s });
    });
    statesBefore.forEach((s, k) => {
        if (!statesAfter.has(k))
            stateRemoved.push(s);
    });
    const copyAdded = [];
    const copyRemoved = [];
    const copyChanged = [];
    textsAfter.forEach((t, k) => {
        const b = textsBefore.get(k);
        if (!b)
            copyAdded.push(t);
        else if (b.text !== t.text)
            copyChanged.push({ before: b, after: t });
    });
    textsBefore.forEach((t, k) => {
        if (!textsAfter.has(k))
            copyRemoved.push(t);
    });
    return {
        routes: { added: routeAdded, removed: routeRemoved, changed: routeChanged },
        apiCalls: { added: apiAdded, removed: apiRemoved, changed: apiChanged },
        uiStates: { added: stateAdded, removed: stateRemoved, changed: stateChanged },
        copy: { added: copyAdded, removed: copyRemoved, changed: copyChanged },
    };
}
//# sourceMappingURL=diff.js.map
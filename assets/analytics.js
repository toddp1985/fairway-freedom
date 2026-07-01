/* TrackPass — PostHog analytics init
 * Session recording, autocapture, pageview tracking.
 * waitlist.js fires conversion events (waitlist_form_started, waitlist_form_completed).
 */
(function () {
  var PH_KEY = 'phc_rsWBUkPcwbtes4XpCSCVHNGYFMipYW5eTFAxgGCT9c4T';

  // Official PostHog async snippet (stubs all methods so calls before load are queued)
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+" (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureFlagEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey".split(" "),i=0;i<o.length;i++)g(u,o[i]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  posthog.init(PH_KEY, {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'always',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    capture_heatmaps: true,
    session_recording: {
      sampleRate: 1.0,
      maskAllInputs: true,
      maskInputOptions: { password: true },
    },
  });

  var page = (window.location.pathname.split('/').filter(Boolean).pop() || '').replace('.html', '') || 'home';
  posthog.register({ site_id: 'trackpass', page: page });
})();

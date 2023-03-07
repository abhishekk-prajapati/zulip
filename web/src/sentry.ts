import * as Sentry from "@sentry/browser";
import {HttpClient as HttpClientIntegration} from "@sentry/integrations";
import {BrowserTracing} from "@sentry/tracing";
import _ from "lodash";

import {page_params} from "./page_params";

type UserInfo = {
    id?: string;
    realm: string;
    role: string;
};

if (page_params.server_sentry_dsn) {
    const url_matches = [/^\//, new RegExp("^" + _.escapeRegExp(page_params.webpack_public_path))];
    if (page_params.realm_uri !== undefined) {
        url_matches.push(new RegExp("^" + _.escapeRegExp(page_params.realm_uri) + "/"));
    }
    const sentry_key = page_params.realm_sentry_key || "(root)";
    const user_info: UserInfo = {
        realm: sentry_key,
        role: page_params.is_owner
            ? "Organization owner"
            : page_params.is_admin
            ? "Organization administrator"
            : page_params.is_moderator
            ? "Moderator"
            : page_params.is_guest
            ? "Guest"
            : page_params.is_spectator
            ? "Spectator"
            : "Member",
    };
    if (page_params.user_id) {
        user_info.id = page_params.user_id.toString();
    }

    Sentry.init({
        dsn: page_params.server_sentry_dsn,
        environment: page_params.server_sentry_environment || "development",

        release: "zulip-server@" + ZULIP_VERSION,
        integrations: [
            new BrowserTracing({
                tracePropagationTargets: url_matches,
            }),
            new HttpClientIntegration({
                failedRequestStatusCodes: [500, 502, 503, 504],
                failedRequestTargets: url_matches,
            }),
        ],
        allowUrls: url_matches,
        sampleRate: page_params.server_sentry_sample_rate || 0,
        tracesSampleRate: page_params.server_sentry_trace_rate || 0,
        initialScope: {
            tags: {
                realm: sentry_key,
                server_version: page_params.zulip_version,
            },
            user: user_info,
        },
    });
}

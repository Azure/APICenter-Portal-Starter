import { Container } from "inversify";

import { ApiService } from "../services/ApiService.ts";
import { TagService } from "../services/TagService.ts";

export function makeInversifyContainer(): Container {
    const container = new Container();
    container.bind("apiService").to(ApiService);
    container.bind("tagService").to(TagService);
    return container;
}

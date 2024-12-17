import { TagService as ITagService } from "apim-developer-portal/src/common/data/tagService.ts";
import { Page } from "apim-developer-portal/src/common/models/page.ts";
import { SearchQuery } from "apim-developer-portal/src/common/models/searchQuery.ts";
import { Tag } from "apim-developer-portal/src/common/models/tag.ts";

export class TagService implements ITagService {
    getTags(scope?: string, filter?: string, searchQuery?: SearchQuery): Promise<Page<Tag>> {
        return Promise.resolve({
            value: [],
            count: 0,
        });
    }
}

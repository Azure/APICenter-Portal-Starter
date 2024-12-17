import { ApiService as IApiService } from "apim-developer-portal/src/common/data/apiService.ts";
import { Api } from "apim-developer-portal/src/common/models/api.ts";
import { Page } from "apim-developer-portal/src/common/models/page.ts";
import { SearchQuery } from "apim-developer-portal/src/common/models/searchQuery.ts";
import { TagGroup } from "apim-developer-portal/src/common/models/tagGroup.ts";
import { TApisData } from "apim-developer-portal/src/common/types.ts";

export class ApiService implements IApiService {
    getApis(searchQuery?: SearchQuery): Promise<TApisData> {
        return Promise.resolve({
            value: [],
            count: 0,
        });
    }

    getApisByTags(searchRequest?: SearchQuery): Promise<Page<TagGroup<Api>>> {
        return Promise.resolve({
            value: [],
            count: 0,
        });
    }
}

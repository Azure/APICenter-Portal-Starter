/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input, Spinner } from "@fluentui/react-components";
import {
    Cloud16Regular,
    Dismiss12Regular,
    Dismiss16Regular,
    Search16Regular,
    Search24Regular,
} from "@fluentui/react-icons";

import { Api } from "../../../contracts/api";
import { useApiService } from "../../../util/useApiService";
import { LocalStorageKey, useLocalStorage } from "../../../util/useLocalStorage";
import { useSession } from "../../../util/useSession";

import css from "./index.module.scss";

let timeoutId: number | undefined;

export type TSearchRecent = { type: "api" | "string"; key: string; value: string; api?: Api };

const Search = () => {
    const localStorage = useLocalStorage(LocalStorageKey.searchRecents);
    const session = useSession();
    const isAuthenticated = session.isAuthenticated();
    const apiService = useApiService();
    const navigate = useNavigate();
    const ref = useRef<HTMLDivElement>(null);

    const [inputValue, setInputValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [recents, setRecents] = useState<TSearchRecent[]>(JSON.parse(localStorage.get() ?? "[]"));
    const [searchResults, setSearchResults] = useState<Api[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        localStorage.set(JSON.stringify(recents));
    }, [localStorage, recents, isAuthenticated]);

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref]);

    const handleClickOutside = ({ target }: MouseEvent) => {
        if (ref.current && !ref.current.contains(target as Node)) {
            setIsFocused(false);
        }
    };

    const submit = async (search: string) => {
        if (search && isAuthenticated) {
            const searchResults = await apiService.getApis("$search=" + search);
            setSearchResults(searchResults.value);
            setIsLoading(false);
        } else {
            setSearchResults([]);
        }
    };

    const addToRecents = (type: "api" | "string", value: string, api?: Api) => {
        const key = type + "." + value;
        if (!recents.find(recent => recent.key === key)) {
            if (type === "api") {
                setRecents([...recents, { type: "api", key, value, api }]);
            } else {
                setRecents([{ type: "string", key, value }, ...recents]);
            }
        }
    };

    const removeFromRecents = (remove: string) => {
        setRecents(prev => prev.filter(e => e.key !== remove));
    };

    return (
        <div className={css.searchContainer} ref={ref}>
            <Input
                className={css.input}
                size={"large"}
                contentBefore={<Search24Regular style={{ color: css.blueLight }} />}
                contentAfter={
                    inputValue ? (
                        <Dismiss16Regular
                            onClick={() => {
                                setInputValue("");
                                setSearchResults([]);
                                searchParams.delete("search");
                                setSearchParams(searchParams);
                            }}
                        />
                    ) : (
                        ""
                    )
                }
                placeholder={"Search for an API"}
                value={inputValue}
                onChange={e => {
                    const value = e.target.value;
                    if (timeoutId != null) clearTimeout(timeoutId);
                    setIsLoading(true);
                    timeoutId = setTimeout(() => submit(value), 500) as unknown as number;
                    setInputValue(value);
                }}
                onFocus={() => {
                    if (inputValue) {
                        setIsLoading(true);
                        submit(inputValue);
                    }
                    setIsFocused(true);
                }}
                onKeyDown={e => {
                    if (e.key === "Enter") {
                        addToRecents("string", inputValue);
                        searchParams.set("search", inputValue);
                        setSearchParams(searchParams);
                        setIsFocused(false);
                    }
                }}
            />
            {isFocused &&
                (inputValue !== "" ? (
                    searchResults.length ? (
                        <div className={css.popup}>
                            <div className={css.header}>
                                <h6>Suggestions</h6>
                            </div>
                            {searchResults.map(api => (
                                <div key={api.name} className={css.record}>
                                    <button
                                        className={css.recordSelect}
                                        onClick={() => {
                                            setIsFocused(false);
                                            addToRecents("api", api.name, api);
                                            navigate("detail/" + api.name + window.location.search);
                                        }}
                                    >
                                        <Cloud16Regular />
                                        <span className={css.apiName}>{api.name}</span>
                                        <span className={css.apiMeta}>
                                            {api.kind}; {api.lifecycleStage}; {api.summary}
                                        </span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={css.popup}>
                            {isLoading ? (
                                <Spinner size={"small"} className={css.noResults} />
                            ) : (
                                <div className={css.noResults}>Could not find APIs. Try a different search term.</div>
                            )}
                        </div>
                    )
                ) : (
                    !!recents.length && (
                        <div className={css.popup}>
                            <div className={css.header}>
                                <h6>Recents</h6>
                                <button
                                    onClick={() => {
                                        localStorage.remove();
                                        setRecents([]);
                                    }}
                                >
                                    Clear
                                </button>
                            </div>
                            {recents.map(recent => (
                                <div key={recent.key} className={css.record}>
                                    <button
                                        className={css.recordSelect}
                                        onClick={() => {
                                            setIsFocused(false);
                                            if (recent.type === "api") {
                                                navigate("detail/" + recent.value + window.location.search);
                                            } else {
                                                setInputValue(recent.value);
                                                searchParams.append("search", recent.value);
                                                setSearchParams(searchParams);
                                            }
                                        }}
                                    >
                                        {recent.type === "api" ? <Cloud16Regular /> : <Search16Regular />}
                                        <span className={css.apiName}>{recent.value}</span>
                                        {recent.type === "api" && recent.api && (
                                            <span className={css.apiMeta}>
                                                {recent.api.kind}; {recent.api.lifecycleStage}; {recent.api.summary}
                                            </span>
                                        )}
                                    </button>
                                    <button className={css.recordDelete} onClick={() => removeFromRecents(recent.key)}>
                                        <Dismiss12Regular />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )
                ))}
        </div>
    );
};

export default Search;

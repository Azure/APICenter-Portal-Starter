import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import SwaggerUI from 'swagger-ui-react';
import AsyncApiComponent from '@asyncapi/react-component';
import '@asyncapi/react-component/styles/default.min.css';
import { Spinner } from '@fluentui/react-components';

import 'swagger-ui-react/swagger-ui.css';
import ApiService from '@/services/ApiService';
import useApiSpecUrl from '@/hooks/useApiSpecUrl';
import useApiSpec from '@/hooks/useApiSpec';
import useApiDefinition from '@/hooks/useApiDefinition';

const Swagger = () => {
  const {
    name,
    version,
    definition: definitionName,
  } = useParams() as {
    name: string;
    version: string;
    definition: string;
  };

  // const [isLoading, setIsLoading] = useState<boolean>(false);
  // const [specification, setSpecification] = useState(null);
  // const [specType, setSpecType] = useState('rest');

  // const getSpecificationLink = async () => {
  //   if (!version || !definitionName) return;
  //
  //   const definition = await ApiService.getDefinition({ apiName: name, versionName: version, definitionName });
  //
  //   const specName = definition.specification?.name ?? 'rest';
  //   console.log(specName);
  //   setSpecType(specName);
  //
  //   const downloadUrl = await ApiService.getSpecificationLink({ apiName: name, versionName: version, definitionName });
  //   const downloadResult = await fetch(downloadUrl);
  //   const content: any = await downloadResult.text();
  //
  //   setSpecification(content);
  //   setIsLoading(false);
  // };
  // const specLink = useApiSpecUrl({ apiName: name, versionName: version, definitionName });
  const definitionId = useMemo(
    () => ({ apiName: name, versionName: version, definitionName }),
    [name, version, definitionName]
  );
  const definition = useApiDefinition(definitionId);
  const specification = useApiSpec(definitionId);

  // useEffect(() => {
  //   setIsLoading(true);
  //   getSpecificationLink();
  // }, [name, version, definitionName, getSpecificationLink]);

  return (
    <div className="doc-container">
      {specification.isLoading ? (
        <Spinner />
      ) : definition.value?.specification?.name === 'asyncapi' ? (
        specification.value && <AsyncApiComponent schema={specification.value} />
      ) : (
        specification.value && <SwaggerUI spec={specification.value} />
      )}
    </div>
  );
};

export default Swagger;

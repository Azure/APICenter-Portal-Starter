import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SwaggerUI from 'swagger-ui-react';
import AsyncApiComponent from '@asyncapi/react-component';
import '@asyncapi/react-component/styles/default.min.css';
import { Spinner } from '@fluentui/react-components';

import 'swagger-ui-react/swagger-ui.css';
import ApiService from '@/services/ApiService';

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

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [specification, setSpecification] = useState(null);
  const [specType, setSpecType] = useState('rest');

  const getSpecificationLink = async () => {
    if (!version || !definitionName) return;

    const definition = await ApiService.getDefinition(name, version, definitionName);

    const specName = definition.specification?.name ?? 'rest';
    console.log(specName);
    setSpecType(specName);

    const downloadUrl = await ApiService.getSpecificationLink(name, version, definitionName);
    const downloadResult = await fetch(downloadUrl);
    const content: any = await downloadResult.text();

    setSpecification(content);
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    getSpecificationLink();
  }, [name, version, definitionName, getSpecificationLink]);

  return (
    <div className="doc-container">
      {isLoading ? (
        <Spinner />
      ) : specType === 'asyncapi' ? (
        specification && <AsyncApiComponent schema={specification} />
      ) : (
        specification && <SwaggerUI spec={specification} />
      )}
    </div>
  );
};

export default Swagger;

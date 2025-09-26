import memoize from 'memoizee';
import {
  buildSchema,
  GraphQLEnumType,
  GraphQLField,
  GraphQLFieldMap,
  GraphQLInterfaceType,
  GraphQLObjectType,
  isEnumType,
  isNonNullType,
} from 'graphql';
import {
  ApiSpecReader,
  ApiSpecTypes,
  OperationCategory,
  OperationMetadata,
  OperationTypes,
  RequestMetadata,
  ResponseMetadata,
  SchemaMetadata,
} from '@/types/apiSpec';
import { getUsedRefsForType, gqlTypeToLabel } from '@/utils/graphql';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FieldSpec = GraphQLField<any, any>;

/**
 * Returns an instance of ApiSpecReader that reads GraphQL spec from a string.
 */
export async function graphqlReader(specStr: string): Promise<ApiSpecReader> {
  const qlSchema = buildSchema(specStr);

  const getBaseUrl = memoize((): string => {
    return '/';
  });

  const getTagLabels = memoize((): string[] => {
    return [];
  });

  function typeFieldsToOperationsMetadata<T, U>(
    category: string,
    fields: GraphQLFieldMap<T, U>
  ): Array<OperationMetadata<FieldSpec>> {
    return Object.values(fields).map((field) => ({
      type: OperationTypes.DEFAULT,
      category,
      method: '',
      displayName: field.name,
      description: field.description,
      name: `${category}/${field.name}`,
      urlTemplate: '',
      spec: field,
    }));
  }

  const getOperationCategories = memoize((): Array<OperationCategory<FieldSpec>> => {
    const query = qlSchema.getQueryType();
    const mutation = qlSchema.getMutationType();
    const subscription = qlSchema.getSubscriptionType();

    return Object.entries({ query, mutation, subscription })
      .filter(([, type]) => !!type)
      .map(([name, type]) => ({
        name,
        label: type.name,
        operations: typeFieldsToOperationsMetadata(name, type.getFields()),
      }));
  });

  const getOperations = memoize((): Array<OperationMetadata<FieldSpec>> => {
    return getOperationCategories().flatMap((category) => category.operations);
  });

  const getOperation = memoize((operationName: string): OperationMetadata<FieldSpec> | undefined => {
    return getOperations().find((operation) => operation.name === operationName);
  });

  const getRequestMetadata = memoize((operationName: string): RequestMetadata => {
    const operation = getOperation(operationName);

    return {
      description: operation.description,
      body: [
        {
          type: 'default',
          schema: {
            refLabel: operation.spec.name,
            typeLabel: gqlTypeToLabel(operation.spec.type),
            properties: operation.spec.args.map((arg) => ({
              name: arg.name,
              in: 'arguments',
              type: gqlTypeToLabel(arg.type),
              description: arg.description,
              required: isNonNullType(arg.type),
            })),
            rawSchema: {
              schema: specStr.substring(operation.spec.astNode.loc.start, operation.spec.astNode.loc.end),
              language: 'graphql',
            },
          },
        },
      ],
    };
  });

  const getResponsesMetadata = memoize((operationName: string): ResponseMetadata[] => {
    const operation = getOperation(operationName);

    return [
      {
        description: operation.spec.description,
        body: [
          {
            type: 'default',
            schema: {
              typeLabel: gqlTypeToLabel(operation.spec.type),
            },
          },
        ],
      },
    ];
  });

  const getOperationDefinitions = memoize((operationName: string): SchemaMetadata[] => {
    const operation = getOperation(operationName);

    const requestRefs = operation.spec.args.reduce((acc, arg) => getUsedRefsForType(arg.type, acc), [] as string[]);

    return getUsedRefsForType(operation.spec.type, requestRefs)
      .map((ref) => qlSchema.getType(ref) as GraphQLObjectType | GraphQLInterfaceType | GraphQLEnumType)
      .map((type) => {
        if (isEnumType(type)) {
          return {
            $ref: type.name,
            refLabel: type.name,
            typeLabel: gqlTypeToLabel(type),
            properties: Object.values(type.getValues()).map((value) => ({
              name: value.name,
              description: value.description,
            })),
            rawSchema: {
              schema: specStr.substring(type.astNode.loc.start, type.astNode.loc.end),
              language: 'graphql',
            },
            isEnum: true,
            isStatic: true,
          };
        }

        return {
          $ref: type.name,
          refLabel: type.name,
          typeLabel: gqlTypeToLabel(type),
          properties: Object.values(type.getFields()).map((field) => ({
            name: field.name,
            type: gqlTypeToLabel(field.type),
            in: 'body',
            description: field.description,
            required: isNonNullType(field.type),
            readOnly: false,
          })),
          rawSchema: {
            schema: specStr.substring(type.astNode.loc.start, type.astNode.loc.end),
            language: 'graphql',
          },
        };
      });
  });

  return {
    type: ApiSpecTypes.GraphQL,
    getBaseUrl,
    getTagLabels,
    getOperationCategories,
    getOperations,
    getOperation,
    getRequestMetadata,
    getResponsesMetadata,
    getOperationDefinitions,
  };
}

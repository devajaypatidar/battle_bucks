import { SetMetadata } from '@nestjs/common';

export const RESOURCE_TYPE_KEY = 'resourceType';
export const RESOURCE_PARAM_KEY = 'resourceParam';

/**
 * Decorator to protect resources and ensure only owners can access them
 * @param resourceType - The type of resource to protect (e.g., 'purchase', 'character-profile')
 * @param resourceParam - The parameter name containing the resource ID (defaults to 'id')
 */
export const ResourceOwner = (resourceType: string, resourceParam: string = 'id') => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    SetMetadata(RESOURCE_TYPE_KEY, resourceType)(target, propertyName, descriptor);
    SetMetadata(RESOURCE_PARAM_KEY, resourceParam)(target, propertyName, descriptor);
  };
};
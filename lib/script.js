/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global getAssetRegistry */



'use strict';

/**
 * Create the new property
 * @param {property.registration.system.createProperty} prop
 * @transaction
 */

async function createProperty(prop) {   
    const NS = "property.registration.system";
    const me = getCurrentParticipant();
    const factory = getFactory()

    // Get the Property asset registry, and raise error if already exists
    return getAssetRegistry(NS+'Property')
        .then(function (PropertyAssetRegistry) {
        // Determine if the specific property exists in the proprty asset registry.
        return assetRegistry.exists(prop.propertyId);
    })
    .then(function (exists) {
        // Process the the boolean result.
        if(exists)
        {
            console.log('Property exists', exists);
            throw new Error("already exists");
        }
        else{
            // set attributes
            const property = factory.newResource(NS, 'Property', prop.properyId);
            property.marketPrice = prop.marketPrice;
            property.registrationDate = prop.registrationDate;
            property.propertyType = prop.propertyType;
            property.location = tx.location;
            property.owner = me;

            //save property
            const registry = await getAssetRegistry(property.getFullyQualifiedType());
            await registry.add(property);
        }
    })
    .catch(function (error) {
        // Add optional error handling here.
        console.log("Something went wrong.");
    });
}

/**
* Update the property to let know your intent for sale
* @param {property.registration.system.intentForSale} prop
* @transaction
**/
async function intentForSale(prop){
    const NS = "property.registration.system";
    const me = getCurrentParticipant();

    // Get the Property asset registry, and raise error if not already exists
    return getAssetRegistry(NS+'Property')
        .then(function (PropertyAssetRegistry) {
        // Determine if the specific property exists in the proprty asset registry.
        return assetRegistry.exists(prop.propertyId);
    })
    .then(function (exists) {
        // Process the the boolean result.
        if(exists)
        {
            console.log('Property exists', exists);
            // set attributes
            prop.status = 'Intent of Sale';

            //update property
            const registry = await getAssetRegistry(property.getFullyQualifiedType());
            await registry.update(prop);

            const propertyListing = factory.newResource(NS, 'PropertyListing', prop.propertyListingId);
            propertyListing.property = prop;

            //save propertyListing
            const registry = await getAssetRegistry(propertyListing.getFullyQualifiedType());
            await registry.add(propertyListing);
        }
        else{
            throw new Error("No such property exists.");
        }
    })
    .catch(function (error) {
        // Add optional error handling here.
        console.log("Something went wrong.");
    });
}


/**
* When a user wants to purchase a property listed in 'Property Listing', 
* he/she invokes the transaction 'purchaseProperty'
* @param {property.registration.system.purchaseProperty} propList
* @transaction
**/
async function purchaseProperty(propList){
    const NS = "property.registration.system";
    const me = getCurrentParticipant();

    // Get the Property Listing asset registry, and raise error if not already exists
    return getAssetRegistry(NS+'PropertyListing')
        .then(function (PropertyListingAssetRegistry) {
        // Determine if the specific property exists in the proprty asset registry.
        return assetRegistry.exists(propList.propertyListingId);
    })
    .then(function (exists) {
        // Process the the boolean result.
        if(exists)
        {
            console.log('Property exists ', exists);

            const user = await getAssetRegistry(me.getFullyQualifiedType());
            if(user.balance >= propList.property.marketPrice)
            {
                propList.property.status = 'Register';
                propList.property.owner = me;

                user.balance = user.balance - propList.property.marketPrice;
                propList.property.owner.balance = propList.property.owner.balance + propList.property.marketPrice;

                //update property
                const registry = await getAssetRegistry(propList.property.getFullyQualifiedType());
                await registry.update(propList.Property);                
            }

            //remove propertyListing
            const registry = await getAssetRegistry(propertyListing.getFullyQualifiedType());
            await registry.remove(propertyListing);
        }
        else{
            throw new Error("No such property exists.");
        }
    })
    .catch(function (error) {
        // Add optional error handling here.
        console.log("Something went wrong.");
    });
}

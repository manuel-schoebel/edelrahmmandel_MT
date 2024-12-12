import { Layouttypes } from '/imports/api/collections/layouttypes';
import { layouttypesObject } from '/imports/api/constData/layouttypes';

//if (Layouttypes.find().count() != 0) {
    await Layouttypes.removeAsync({});

    const lt = Object.keys(layouttypesObject);
    lt.forEach( async (key) => {
        if (layouttypesObject[key].internalUseOnly) return;
        await Layouttypes.insertAsync(layouttypesObject[key]);
    });
//}
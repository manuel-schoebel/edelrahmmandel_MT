import { OpinionDetails } from '../collections/opinionDetails';
import { renderTemplate } from '../constData/layouttypes';


/**
 * Reposition all details for the given opinion
 * 
 * @param {String} refOpinion Specifies the id of the opinion
 */
export const rePositionDetails = (refOpinion, options = {}) => {

    const rePosition = (refDetail, depth = 0, parentPosition, printParentPosition) => {
        let positionCount = 0,
            printPositionCount = 0;
        depth++;
    
        OpinionDetails.find({
            refOpinion,
            refParentDetail: refDetail,
            //deleted: false,
            finallyRemoved: false
        }, {
            sort: { parentPosition: 1, position: 1 }
        }).forEach( async item => {
            const { _id, type } = item;
            
            positionCount++;
            parentPosition = parentPosition || '';
            printParentPosition = printParentPosition || '';
            if ( type == 'HEADING' || type == 'QUESTION' || type == 'PICTURECONTAINER') printPositionCount++;
    
            rePosition(_id, depth, parentPosition + positionCount + '.', printParentPosition + printPositionCount + '.');
    
            let data = {
                position: positionCount,
                parentPosition,
                printPosition: printPositionCount,
                printParentPosition,
                depth
            }
            if (options.reRenderHtmlContent) {
                data.htmlContent = renderTemplate(item, depth);
            }

            await OpinionDetails.updateAsync(_id, {
                $set: data
            });
        });
    }

    rePosition(null);
}

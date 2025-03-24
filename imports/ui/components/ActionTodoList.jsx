import React, { Fragment } from 'react';
import { Link } from 'react-router';
import Table from 'antd/lib/table';
import Tag from 'antd/lib/tag';

import { actionCodes } from '../../api/constData/actioncodes';
import { useOpinionActionList } from '../../client/trackers';
import { OpinionDetailAdder } from '../ListOpinionDetails/detailtypes/OpinionDetailAdder';
import { EditableContent } from './EditableContent';

export const ActionTodoList = ({item, refOpinion, last, permissions}) => {
    const [ actionListitems, isLoading ] = useOpinionActionList(refOpinion);
    
    const { _id, depth, text, deleted } = item;
    const deletedClass = deleted ? 'mbac-opinion-detail-deleted':'';

    const cols = [
        {
            title: 'Maßnahme',
            dataIndex: 'actionCode',
            key: 'actionCode',
            width: 250,
            render: code => <Tag color={actionCodes[code].color}>{actionCodes[code].text}</Tag>
        }, {
            title: 'Text',
            dataIndex: 'actionText',
            key: 'actionText',
            render: (actionText, record) => <Link to={`/opinions/${record.refOpinion}/${record._id}`}>{actionText}</Link>,
        }
    ];
    
    let groupedItems = [];
    Object.keys(actionCodes).forEach( code => {
        //const filteredItems = actionListitems.filter( item => item.actionCode === code);
        // Sortierung der actionListitems numerisch.
        /* Das (Sortierung des Arrays) ist notwendig, weil leider Funktionalität Mongo collation nicht enthalten ist unter Meteor.
        Mit collation wäre nur folgendes notwendig in find():        
        collation: {
                locale: 'de',
                numericOrdering: true
            }
        https://forums.meteor.com/t/is-there-a-way-to-use-mongodb-3-4-collation/33024/13
        */
        let filteredItems = actionListitems.filter( item => item.actionCode === code);
        filteredItems = filteredItems.sort( (a , b) => {
            if ( !a
              || !a.parentPosition
              || !a.position )
                return -1;
            else if ( !b
                   || !b.parentPosition
                   || !b.position )
                return 1;
            return (a.parentPosition.toString() + a.position.toString()).localeCompare( (b.parentPosition.toString() + b.position.toString()) , undefined , { numeric: true } );
        });

        if (filteredItems.length > 0) {
            groupedItems.push({
                key: code,
                actionCode: code,
                children: filteredItems
            });
        }
    });

    return (
        <Fragment>
            <OpinionDetailAdder item={item} permissions={permissions} />
            <div className={`mbac-opinion-detail depth-${depth} ${deletedClass}`}>
                <div id={_id} className={`mbac-item-type-todolist depth-${depth}`}>
                    <div className="mbac-text" >
                        <EditableContent type="wysiwyg" 
                            value={text}
                            field="text"
                            refDetail={_id}
                            item={item}
                            permissions={permissions}
                        />
                    </div>
                    <div className="mbac-todolist">
                        <Table 
                            dataSource={groupedItems} 
                            columns={cols} 
                            pagination={false}
                            loading={isLoading}
                        />
                    </div>
                </div>
            </div>
            { !last ? null : <OpinionDetailAdder after item={item} permissions={permissions} /> }
        </Fragment>
    )
}
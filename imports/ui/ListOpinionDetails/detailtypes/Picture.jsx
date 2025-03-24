import React, { Fragment } from 'react';

import { EditableContent } from '../../components/EditableContent';
import { ListImages } from '../../ListImages';
//import { OpinionDetailAdder } from './OpinionDetailAdder';

import Col from 'antd/lib/col';
import Row from 'antd/lib/row';
import Divider from 'antd/lib/divider';

export const Picture = ( { item, permissions, first, last } ) => {
    const { _id, depth, files, printTitle, text, deleted } = item;
    const deletedClass = deleted ? 'mbac-opinion-detail-deleted':'';

    return (
        <Fragment>
            {/*<OpinionDetailAdder item={item} permissions={permissions} />*/}
            <div className={`mbac-opinion-detail depth-${depth} ${deletedClass}`}>
                <div id={_id} className={`mbac-item-type-picture depth-${depth}`}>
                    <div className="mbac-picture">
                        <Row gutter={[16,16]}>
                            <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                                <ListImages imageOrImages={files} />
                            </Col>
                            <Col xs={24} sm={24} md={12} lg={16} xl={16}>
                                <div className="mbac-title" >
                                    <EditableContent type="span" 
                                        value={printTitle}
                                        field="printTitle"
                                        refDetail={_id}
                                        item={item}
                                        permissions={{canEdit:false, canDelete:permissions.canDelete}}
                                    />
                                </div>

                                <div className="mbac-text" >
                                    <EditableContent type="wysiwyg" 
                                        value={text}
                                        field="text"
                                        refDetail={_id}
                                        item={item}
                                        permissions={permissions}
                                    />
                                </div>
                            </Col>
                            <Divider />
                        </Row>      
                    </div>
                </div>
            </div>
            { /*!last ? null : <OpinionDetailAdder after item={item} permissions={permissions} /> */}
        </Fragment>
    )
}
import { Meteor } from 'meteor/meteor';
import React, { Fragment, useEffect, useState } from 'react';
import List from 'antd/lib/list';
import Space from 'antd/lib/space';
import Progress from 'antd/lib/progress';
import Tag from 'antd/lib/tag';
import Table from 'antd/lib/table';
import Modal from 'antd/lib/modal';
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';

import ClearOutlined from '@ant-design/icons/ClearOutlined';
import Tooltip from 'antd/lib/tooltip';

import { useOpinions } from '../client/trackers';
import { MediaQuery, useMediaQueries } from '../client/mediaQueries';

import Input from 'antd/lib/input';

import Switch from 'antd/lib/switch';
import { Link } from 'react-router';

const lower = a => {
    if (!a) return '';

    return a.toLowerCase();
}

export const ListOpinions = ({currentUser}) => {
    const [ allOpinionsForControl , setAllOpinionsForControl ] = useState( false );
    const [ opinions , isLoading ] = useOpinions( allOpinionsForControl );
    const [ filteredOpinions , setFilteredOpinions ] = useState( opinions );

    const { isDesktop } = useMediaQueries();

    // Spezialrolle für Gutachten Kontrolle beachten, falls bei User vorhanden.
    let hasRoleOPINION_CONTROL = false;
    if ( currentUser )
    {
        if ( currentUser.userData.roles.includes( 'OPINION_CONTROL' ) )
            hasRoleOPINION_CONTROL = true;
    }

    // Filter zurücksetzen über useEffect:
    // - Wenn isLoading sich ändert, also nachdem alle Gutachten geladen sind. Ansonsten wäre beim ersten Öffnen bzw. neu Laden die Liste leer.
    // - Wenn sich die Anzahl der Gutachten ändert, also nach Neuanlage oder Löschen eines Gutachtens.
    useEffect( () => {
        setFilteredOpinions( opinions );
      } , [ isLoading , opinions.length ]);
    
    const deleteOpinion = id => {
        Modal.confirm({
            title: 'L Ö S C H E N',
            icon: <ExclamationCircleOutlined />,
            content: <span>Soll dieses Gutachten wirklich (für dich!) gelöscht werden?</span>,
            okText: 'OK',
            okType: 'danger',
            cancelText: 'Abbruch',
            onOk: closeConfirm => {
                closeConfirm();
                /*Meteor.call('opinions.unshareOpinionUser' , id , ( err ) => {
                    if ( err ) {
                        console.log( `Fehler beim Löschen des Gutachtens mit ID ${id}`, err );
                    }
                });*/
                // Umstellung auf Async für Meteor Version 2.8, https://guide.meteor.com/2.8-migration
                Meteor.callAsync('opinions.unshareOpinionUserAsync' , id ).then( ( err ) => {
                    if ( err ) {
                        console.log( `Fehler beim Löschen des Gutachtens mit ID ${id}`, err );
                    }
                });
            }
        });
    }

    let columns = [
        {
            title: ' ',
            dataIndex: 'statusProgress',
            key: 'statusProgress',
            render: (text, row) => 
                <Space>
                    <Progress type="circle" percent={row.status == 'Angelegt' ? 2 : row.status == 'Bearbeitung' ? 25 : row.status == 'Korrektur' ? 50 : row.status == 'Vorabversion' ? 75 : row.status == 'Fertig' ? 100 : row.status == 'Ungültig' ? 100 : "?"}  width={35} status={row.status == 'Ungültig' ? "exception" : ""} />
                </Space>
        },
        {
            title: 'Titel',
            dataIndex: 'title',
            key: 'title',
            render: (text, row) => <Link to={"/opinions/" + row._id}>
                <Tooltip title="Gutachten öffnen">
                    <Space>
                        {text}
                        {row.isTemplate ? <Tag color="green">Vorlage</Tag> : null}
                    </Space>
                </Tooltip>
            </Link>,
            sorter: (a, b) => lower(a.title).localeCompare(lower(b.title)),
        },
        {
            title: 'Beschreibung',
            dataIndex: 'description',
            key: 'description',
            sorter: (a, b) => lower(a.description).localeCompare(lower(b.description)),
        },
        {
            title: '#Nr',
            dataIndex: 'opinionNo',
            key: 'opinionNo',
            sorter: (a, b) => lower(a.opinionNo).localeCompare(lower(b.opinionNo)),
            defaultSortOrder: 'descend'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            sorter: (a, b) => lower(a.status).localeCompare(lower(b.status))
        }
    ];

    if (isDesktop) {
        columns = columns.concat([
            {
                title: 'Kunde',
                dataIndex: 'customer',
                key: 'customer.name',
                render: (text, row) => row.customer.name,
                sorter: (a, b) => lower(a.customer.name).localeCompare(lower(b.customer.name)),
            },
            {
                title: 'Ort',
                dataIndex: 'customerCity',
                key: 'customer.city',
                render: (text, row) => row.customer.city,
                sorter: (a, b) => lower(a.customer.city).localeCompare(lower(b.customer.city)),
            },
        ]);
    }

    columns = columns.concat([
        {
            title: ' ',
            dataIndex: 'delete',
            key: 'delete',
            align:"right",
            render: (text, row) => {
                return <Space size='small'>
                {     
                    <Tooltip title="Gutachten (nur für dich!) löschen">
                        <ClearOutlined key="delete" onClick={_=>deleteOpinion( row._id )} />
                    </Tooltip>                             
                }
                </Space>
            }
        }
    ]);
    
    const onChangeText = ( val ) => {        
        if ( val ) {
            const filterText = val.target.value;
            if ( filterText == '' )
                setFilteredOpinions( opinions );
            else
                setFilteredOpinions( opinions.filter( detail => { 
                    return detail.title.toLowerCase().includes( filterText.toLowerCase() );
                }));
        }
    };

    // Umschalten auf alle Gutachten für Spezialrolle für Gutachten Kontrolle.
    const onUseSwitch = ( checked ) => {
        setAllOpinionsForControl( checked );
    };
      
    return (
        <Fragment>
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                {
                    !hasRoleOPINION_CONTROL ? null :
                    <Space.Compact block>
                        <Space direction="horizontal">
                            <Switch onChange={onUseSwitch} /> Gutachtenkontrolle (alle Gutachten anzeigen)
                        </Space>
                    </Space.Compact>
                }
                <Input
                    placeholder="Hier tippen, um die Gutachtenliste nach Titel zu filtern"
                    allowClear
                    onChange={onChangeText}
                />
            </Space>
            <MediaQuery showAtPhone={true}>
                <List
                    itemLayout="horizontal"
                    //dataSource={opinions}
                    dataSource={filteredOpinions}
                    loading={isLoading}
                    renderItem={opinion => (
                        <List.Item>
                            <List.Item.Meta
                                title={
                                    <Link to={"/opinions/" + opinion._id}>
                                        <Space>
                                            {opinion.title}
                                            {
                                                opinion.isTemplate
                                                    ? <Tag color="green">Vorlage</Tag>
                                                    : null
                                            }
                                        </Space>
                                    </Link>}
                                description={('Nr. ' + opinion.opinionNo + ' - ' + opinion.description + ' - ' + opinion.customer.name + ', ' + opinion.customer.city)}
                            />
                        </List.Item>
                    )}
                />
            </MediaQuery>

            <MediaQuery showAtTablet={true} showAtDesktop={true}>
                <Table
                    columns={columns} 
                    //dataSource={opinions} 
                    dataSource={filteredOpinions}
                    loading={isLoading}
                    rowKey="_id"
                    pagination={false}
                    showSorterTooltip={false}
                />
            </MediaQuery>
        </Fragment>
    );
}

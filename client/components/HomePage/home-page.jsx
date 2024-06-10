import { EllipsisOutlined } from '@ant-design/icons';
import { Button, Dropdown, List, Menu, Table } from 'antd';
import axios from 'axios';
import _ from 'lodash';
import React from 'react';
import { STATUS_OK, RESP_STATUS_OK, RESP_STATUS_FAIL } from '../../../lib/constants';
import DatabaseType from '../../../lib/databaseTypes';
import actions from '../../utils/Actions';
import { copyContent, getTestSql, ModalType, showConfirm, showMessage } from '../../utils/utils';
import NewDatabase from '../NewDatabase';


export function ModalComp(props) {
    /** @type {HomePage} */
    const react_component = props.react_component;
    const { modalType, modalData } = react_component.state;
    switch (modalType) {
        case ModalType.NewDatabase:
            return <NewDatabase width={550} {...props} ></NewDatabase>
        default: {
            return <div></div>
        }
    }
}

export default class HomePage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            databases: [],
            awsRegions: [],
            modalType: ModalType.None,
            modalData: {}
        }
    }


    /**
     * 
     * @param {*} info 
     * @param {DefaultDatabase} transItem 
     */
    menuClickHandler = async (info, transItem) => {
        const { databases } = this.state;
        switch (info.key) {
            case "edit":
                this.setState({
                    modalType: ModalType.NewDatabase,
                    modalData: {
                        database: transItem,
                        databases: databases,
                        cb:
                            /**
                             * 
                             * @param {DefaultDatabase} newDatabase 
                             */
                            async (newDatabase) => {
                                let target = _.filter(databases, (database) => {
                                    return database.name === newDatabase.name
                                })[0];
                                if (!target) {
                                    showMessage("Name Can Not Find!", 'error');
                                }
                                if (_.isEqual(newDatabase, target)) {
                                    return;
                                }
                                let result = await axios.post("addDatabase", { ...newDatabase, edit: true })
                                if (STATUS_OK === result.status && RESP_STATUS_OK === result.data.status) {
                                    databases.splice(databases.indexOf(target), 1, newDatabase);
                                    actions.variable(actions.types.DATABASES, [], () => {
                                        return databases;
                                    })
                                    this.setState({ databases })
                                } else {
                                    showMessage("Edit Database Fail!", 'error');
                                }
                            }
                    },
                })
                break;
            case "remove":
                showConfirm(<div>Are you sure you want to delete <span className="text-primary">{transItem.name}</span>?</div>,
                    async () => {
                        let result = await axios.post("removeDatabase", { name: transItem.name })
                        if (STATUS_OK === result.status && RESP_STATUS_OK === result.data.status) {
                            databases.splice(databases.indexOf(transItem), 1);
                            actions.variable(actions.types.DATABASES, [], () => {
                                return databases;
                            })
                            this.setState({ databases })
                        } else {
                            showMessage("Remove Database Fail!", 'error');
                        }
                    }, undefined, { okType: 'danger' }
                );
                break;
            case "test":
                this.onTest(transItem);
                break;
        }
    }

    /**
    * 
    * @param {DefaultDatabase} dbInfo 
    */
    async onTest(dbInfo) {
        let headers = {}
        let databaseType = DatabaseType[dbInfo.type];
        let result = await axios.post(`${databaseType.shortName}/${dbInfo.name}`, { sql: getTestSql(dbInfo) }, { headers: headers })
            .then(
                (res) => {
                    return res;
                },
                (e) => {
                    console.error(e)
                    return { status: RESP_STATUS_FAIL, msg: e.message || "" };
                }
            );
        if (result.status == STATUS_OK) {
            if (result.data && result.data.error) {
                showMessage(`Error: ${result.data.error}`, 'warning')
            } else {
                showMessage("Connection Success", 'success')
            }
        } else {
            showMessage(`Connection Failed! ${result.msg}`, 'warning')
        }
    }

    Databases = () => {
        const { databases } = this.state;
        const MenuFunc = /** @param {DefaultDatabase} item */(item) => (<Dropdown arrow={true} overlay={
            <Menu onClick={(info) => {
                this.menuClickHandler(info, item)
            }}>
                {<Menu.Item key="test">
                    <i className="iconfont icon icon-icon-link"></i>Test connection
                </Menu.Item>}
                {<Menu.Item key="edit">
                    <i className="icon fas fa-pen"></i>Edit
                </Menu.Item>}
                {<Menu.Item key="remove">
                    <i className="icon fas fa-trash"></i>Remove
                </Menu.Item>}
            </Menu>
        } trigger={['click']}>
            <EllipsisOutlined
                onClick={e => e.preventDefault()} className="icon" title="more" />
        </Dropdown>)
        let sorter = (a, b) => {
            return a > b ? 1 : -1
        };
        const columns = [
            {
                title: 'Name',
                dataIndex: 'name',
                sorter: sorter,
                render: (text, record, index) => {
                    let databaseType = DatabaseType[record.type];
                    return <div>
                        <div> {text} </div>
                        <small> {`${location.href}${location.href.endsWith("/") ? "" : "/"}${databaseType.shortName}/${text}`} </small>
                    </div>
                }
            },
            {
                title: 'Type',
                dataIndex: 'type',
                sorter: sorter,
            },
            {
                title: 'Url',
                dataIndex: 'url',
                sorter: sorter,
                render: (text) => {
                    return <Button className="btn-primary" onClick={(e) => {
                        copyContent(text);
                    }}>Copy Url</Button>
                }
            },
            {
                title: 'Action',
                dataIndex: 'action',
                render: (text, record) => {
                    return <div>
                        {MenuFunc(_.filter(databases, (value, index) => {
                            return value.name === record.name
                        })[0])}
                    </div>
                }
            },
        ];

        const data = _.map(databases, (value, index) => {
            const { type } = value;
            let databaseType = DatabaseType[type];
            let url = _.reduce(_.merge(_.cloneDeep(databaseType.fields), value), (prev, v, k) => {
                prev = prev.replace(`{${k}}`, v)
                return prev;
            }, databaseType.template);
            return {
                key: value.name,
                name: value.name,
                type: value.type,
                url: url,
                action: value.name,
            }
        });
        return <div>
            <List.Item className="sub-title"
                actions={[
                    <Button onClick={() => {
                        this.setState({
                            modalType: ModalType.NewDatabase,
                            modalData: {
                                databases: databases,
                                cb:
                                    /**
                                     * 
                                     * @param {DefaultDatabase} newDatabase 
                                     */
                                    async (newDatabase) => {
                                        if (_.filter(databases, (database) => {
                                            return database.name === newDatabase.name
                                        }).length > 0) {
                                            return showMessage("Name Can Not Be Repeated!", 'error');
                                        }
                                        let result = await axios.post("addDatabase", newDatabase)
                                        if (STATUS_OK === result.status && RESP_STATUS_OK === result.data.status) {
                                            databases.push(newDatabase);
                                            actions.variable(actions.types.DATABASES, [], () => {
                                                return databases;
                                            })
                                            this.setState({ databases })
                                        } else {
                                            console.error(result);
                                            showMessage("Add Database Fail!", 'error');
                                        }
                                    }
                            },
                        })
                    }}>New Database</Button>
                ]}
            >
                <List.Item.Meta
                    avatar={<i className={`icon icon-inactive fas fa-database`}></i>}
                />
            </List.Item>
            <Table columns={columns} dataSource={data} onChange={(pagination, filters, sorter, extra) => {
                console.log('params', pagination, filters, sorter, extra);
            }} />
        </div>
    }

    async componentDidMount() {
        let result = await axios.get("databases")
            .then(
                (res) => {
                    return res;
                },
                (e) => {
                    console.error(e)
                    return { status: RESP_STATUS_FAIL, msg: e.message };
                }
            );
        if (STATUS_OK === result.status && RESP_STATUS_OK === result.data.status) {
            this.setState({ databases: result.data.data, awsRegions: result.data.awsRegions })
        } else {
            showMessage(`Get Server List Fail! ${result.msg}`, "error");
        }
    }

    render() {
        return (
            <div className="home-container">
                <this.Databases></this.Databases>
                <ModalComp react_component={this}></ModalComp>
            </div>
        )
    }
}
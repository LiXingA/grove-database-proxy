import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import {
    Button,
    Checkbox, Col, Form,
    Input,
    InputNumber,
    Row, Select,
    Switch,
    Upload,
} from 'antd';
import Modal from 'antd/lib/modal/Modal';
import _ from 'lodash';
import PropTypes from "prop-types";
import React from 'react';
import { RESP_STATUS_OK, STATUS_OK } from '../../../lib/constants';
import DatabaseType from '../../../lib/databaseTypes';
import { ModalType, MODAL_WIDTH, MODAL_Z_INDEX, showMessage, parse } from "../../utils/utils";
import HomePage from '../HomePage';
import MyDropzone from '../MyDropzone';
import axios from 'axios';

const { Option } = Select;
export default class NewDatabase extends React.Component {
    static propTypes = {
        className: PropTypes.string,
        width: PropTypes.number,
        react_component: PropTypes.object,
    };
    static defaultProps = {};

    constructor(props) {
        super(props);
        /**@type {HomePage}*/
        const react_component = this.props.react_component;
        /**@type {DefaultDatabase} */
        let database = react_component.state.modalData.database;
        let newState = () => {
            let type = DatabaseType.Mysql.name;
            let fields = _.reduce(DatabaseType, (prev, curr, key) => {
                _.each(_.keys(curr.fields), (key) => {
                    _.merge(prev, curr.fields[key]);
                })
                return prev;
            }, {})
            _.merge(fields, _.cloneDeep(DatabaseType[type].fields))
            return {
                acceptedFile: "",
                modalName: ModalType.NewDatabase,
                name: "",
                type: type,
                ...fields,
            }
        }
        this.state = database ? { acceptedFile: { path: database.file, size: -1 }, modalName: "Edit Database", ...database } : newState();
        this.oldState = _.cloneDeep(this.state);
    }

    componentDidMount() {
    }

    componentDidUpdate(prevProps, prevState) {
    }

    render() {
        const { className, width } = this.props;
        const { name, type, modalName, acceptedFile, file } = this.state;
        /**@type {HomePage}*/
        const react_component = this.props.react_component;
        const { modalType, modalData: { databases } } = react_component.state;
        const closeFunc = () => {
            react_component.setState({
                modalType: ModalType.None,
                modalData: {},
            });
        };
        let pairs = _.reduce(_.keys(DatabaseType[type].fields), (prev, key) => {
            if (prev.length && prev[prev.length - 1].length === 1) {
                prev[prev.length - 1].push(key);
            } else {
                prev.push([key]);
            }
            return prev;
        }, []);
        const onFinish = (vs) => {
            const values = _.cloneDeep(vs);
            console.log('Success:', values);
            if (type === DatabaseType.BigQuery.name && this.state.file === "") {
                return showMessage("File Can Not Be Empty!", 'error');
            }
            if (undefined !== this.state.file) {
                values.file = this.state.file;
            }
            const { react_component } = this.props;
            const { modalData: { cb } } = react_component.state;
            if (modalName === ModalType.NewDatabase) {
                if (_.filter(databases, (database) => {
                    return database.name === values.name
                }).length > 0) {
                    return showMessage("Name Can Not Be Repeated!", 'error');
                }
            }
            if (!_.isEqual(values, _.pick(this.oldState, _.keys(values)))) {
                cb(values);
            }
            closeFunc();
        };

        const onFinishFailed = (errorInfo) => {
            showMessage(_.reduce(errorInfo.errorFields, (prev, curr, index) => {
                prev += curr.errors.join(",")
                return prev + "; ";
            }, ""), 'error')
            console.log('Failed:', errorInfo);
        };
        return <Modal zIndex={MODAL_Z_INDEX}
            className={`modal-comp data-html2canvas-ignore ${className}`}
            width={width || MODAL_WIDTH}
            title={<div><h4>{modalName}</h4></div>}
            visible={modalType !== ModalType.None}
            onCancel={closeFunc}
            footer={null}
        >
            <Form key={type} layout={"vertical"}
                initialValues={this.state}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
            >
                <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
                    <Col className="gutter-row" span={{ md: 24, lg: 12 }}>
                        <Form.Item label="Name" name="name" rules={[
                            {
                                required: true,
                            },
                            ({ getFieldValue }) => ({
                                validator(rule, value) {
                                    if (!value) {
                                        return Promise.resolve();
                                    }
                                    if (modalName === ModalType.NewDatabase) {
                                        if (_.filter(databases, (database) => {
                                            return database.name === value
                                        }).length > 0) {
                                            return Promise.reject(new Error("Name Can Not Be Repeated!"));
                                        }
                                    }
                                    return Promise.resolve();
                                },
                            }),
                        ]}>
                            <Input readOnly={modalName === ModalType.NewDatabase ? false : true}
                                onChange={(e) => {
                                    this.setState({ name: e.target.value })
                                }} />
                        </Form.Item>
                    </Col>
                    <Col className="gutter-row" span={{ md: 24, lg: 12 }}>
                        <Form.Item label="Type" name="type" rules={[
                            {
                                required: true,
                            },
                        ]}>
                            <Select
                                style={{ width: 120 }}
                                onChange={(ntype) => {
                                    console.log(ntype)
                                    this.setState({
                                        type: ntype,
                                        ..._.cloneDeep(DatabaseType[ntype].fields),
                                    })
                                }}
                            >{_.map(_.keys(DatabaseType), (key) => {
                                return <Option key={key} value={key}>{key}</Option>
                            })}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
                {
                    _.map(pairs,
                        /**
                         * 
                         * @param {[]} fieldPair 
                         * @param {*} index 
                         */
                        (fieldPair, index) => {
                            return <Row key={fieldPair.join("_")} gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
                                {_.map(fieldPair, (field, index) => {
                                    let Template = DatabaseType[type].fields;
                                    let Comp;
                                    if (typeof Template[field] === 'boolean') {
                                        Comp = <Switch onChange={(e) => {
                                            let state = {}; state[field] = e;
                                            this.setState(state);
                                        }} />;
                                    } else if (typeof Template[field] === 'number') {
                                        Comp = <InputNumber onChange={(e) => {
                                            let state = {}; state[field] = e;
                                            this.setState(state);
                                        }} />;
                                    } else if (field === 'protocal') {
                                        Comp = <Select style={{
                                            width: 120,
                                        }} onChange={(e) => {
                                            let state = {}; state[field] = e;
                                            this.setState(state);
                                        }} >{_.map(["neo4j", "neo4j+s", "neo4j+ssc", "bolt", "bolt+s", "bolt+ssc"], (key) => {
                                            return <Option key={key} value={key}>{key}</Option>
                                        })}</Select>;
                                    } else if (field === 'region' && type === DatabaseType.DynamoDB.name) {
                                        Comp = <Select
                                            style={{ width: 120 }}
                                            onChange={(ntype) => {
                                                let state = {}; state[field] = ntype;
                                                this.setState(state);
                                            }}
                                        >{_.map(react_component.state.awsRegions, (obj, index) => {
                                            return <Option key={obj.Region} value={obj.Region}>{obj.Region}</Option>
                                        })}
                                        </Select>;
                                    } else if (field === 'file') {
                                        if (type === DatabaseType.BigQuery.name) {
                                            return <Col key={field} className="gutter-row" span={{ md: 24, lg: 12 }}>
                                                <MyDropzone input={true}
                                                    multiple={false}
                                                    accept=".json"
                                                    handleFilesFunc={async (acceptedFiles) => {
                                                        if (acceptedFiles.length >= 1) {
                                                            let acceptedFile = acceptedFiles[0];
                                                            let text = await parse(acceptedFile);
                                                            console.log(text);
                                                            let fd = new FormData();
                                                            fd.append("fileName", acceptedFile.name)
                                                            fd.append("data", text)
                                                            let result = await axios.post("uploadFile", fd);
                                                            if (STATUS_OK === result.status && RESP_STATUS_OK === result.data.status) {
                                                                let state = { acceptedFile }; state[field] = acceptedFile.name;
                                                                this.setState(state);
                                                            } else {
                                                                showMessage(JSON.stringify(result), 'error')
                                                            }
                                                        }
                                                    }}>
                                                    <div className="text-center">
                                                        <div>Drag and drop service account key file to this panel or</div>
                                                        <Button type='default'>Select a file</Button>
                                                        {acceptedFile && (
                                                            <ul>
                                                                <li key={acceptedFile.path}>
                                                                    {acceptedFile.path} - {acceptedFile.size} bytes
                                                                </li>
                                                            </ul>
                                                        )}
                                                    </div>
                                                </MyDropzone>
                                                <p>A JSON key file belonging to a service account, with the ‘BigQuery Data Viewer’ and ‘BigQuery Job User’ roles, is required to access BigQuery. See the documentation for <a className="fw5" target="_blank" rel="noopener noreferrer" href="https://cloud.google.com/iam/docs/creating-managing-service-account-keys#creating_service_account_keys">creating service accounts</a> and <a className="fw5" target="_blank" rel="noopener noreferrer" href="https://cloud.google.com/bigquery/docs/access-control">assigning roles</a> for more information.</p>
                                            </Col>
                                        } else if (type === DatabaseType.DynamoDB.name) {
                                            return <Col key={field} className="gutter-row" span={{ md: 24, lg: 12 }}>
                                                <MyDropzone input={true}
                                                    multiple={false}
                                                    accept=".csv"
                                                    handleFilesFunc={async (acceptedFiles) => {
                                                        if (acceptedFiles.length >= 1) {
                                                            let acceptedFile = acceptedFiles[0];
                                                            let text = await parse(acceptedFile);
                                                            console.log(text);
                                                            let fd = new FormData();
                                                            fd.append("fileName", acceptedFile.name)
                                                            fd.append("data", text)
                                                            let result = await axios.post("uploadFile", fd);
                                                            if (STATUS_OK === result.status && RESP_STATUS_OK === result.data.status) {
                                                                let state = { acceptedFile }; state[field] = acceptedFile.name;
                                                                this.setState(state);
                                                            } else {
                                                                showMessage(JSON.stringify(result), 'error')
                                                            }
                                                        }
                                                    }}>
                                                    <div className="text-center">
                                                        <div>Drag and drop access key file to this panel or</div>
                                                        <Button type='default'>Select a file</Button>
                                                        {acceptedFile && (
                                                            <ul>
                                                                <li key={acceptedFile.path}>
                                                                    {acceptedFile.path} - {acceptedFile.size} bytes
                                                                </li>
                                                            </ul>
                                                        )}
                                                    </div>
                                                </MyDropzone>
                                                <p>A CSV key file belonging to a <a className="fw5" target="_blank" rel="noopener noreferrer" href='https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html'>IAM</a> users, with the ‘AmazonDynamoDBReadOnlyAccess’ and ‘AmazonDynamoDBFullAccess’ permissions, is required to access DynamoDB. See the documentation for <a className="fw5" target="_blank" rel="noopener noreferrer" href="https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html">What is Amazon DynamoDB?</a> and <a className="fw5" target="_blank" rel="noopener noreferrer" href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html?icmpid=docs_iam_console#Using_CreateAccessKey">Managing access keys for IAM users</a> for more information.</p>
                                            </Col>
                                        }
                                    } else {
                                        Comp = <Input type={!~(DatabaseType[type].HideFields || []).indexOf(field) ? 'text' : 'password'} onChange={(e) => {
                                            let state = {}; state[field] = e.target.value;
                                            this.setState(state);
                                        }} />;
                                    }
                                    return <Col key={field} className="gutter-row" span={{ md: 24, lg: 12 }}>
                                        <Form.Item valuePropName={typeof Template[field] === 'boolean' ? "checked" : "value"} label={field.camelPeakToBlankSplit().firstUpperCase()}
                                            name={field}
                                            rules={[
                                                {
                                                    required: ~(DatabaseType[type].OptionFields).indexOf(field) ? false : true,
                                                },
                                            ]}
                                        >
                                            {Comp}
                                        </Form.Item>
                                    </Col>
                                })}
                            </Row>
                        })
                }
                <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
                    <Col className="gutter-row" style={{ textAlign: "right" }} span={24}>
                        <Form.Item key="back"  >
                            <div className="d-flex justify-content-end">
                                <Button key="back" onClick={closeFunc}>
                                    Cancel
                                </Button>&nbsp;&nbsp;
                                <Button key="addNew" type="primary" htmlType="submit" disabled={_.isEqual(this.state, this.oldState)}>
                                    {modalName === ModalType.NewDatabase ? "Add New" : "Save Changes"}
                                </Button>
                            </div>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    }
}
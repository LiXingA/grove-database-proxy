import { Button, Spin } from "antd";
import React from "react"
import _ from 'lodash';
import actions from "../utils/Actions";

export default class Loading extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: false
        }
        this.loadingElement = document.createElement("div");
    }

    componentDidMount() {
        actions.inspector(this.loadingElement, [actions.types.LOADING],
            (loadingData) => {
                const { loading } = this.state;
                if (loadingData.loading === loading) {
                    console.warn("loading state conflict!", loadingData.loading)
                }
                this.setState({ loading: loadingData.loading }, loadingData.cb);
            })
    }

    componentWillUnmount() {
        actions.deleteCache(this.loadingElement);
    }

    render() {
        const { loading } = this.state;
        return <React.Fragment>{
            loading && <div className="loading-top normal-icon">
                <Button className={`${!safeMode ? "icon-inactive" : ""}`} onClick={() => {
                    window.location.href = window.location.href
                }} type="link" icon={<i className={`far fa-life-ring`} title={`safe mode`}></i>}>Reload</Button>
                <Spin spinning={true} >
                    <div className="full-div"></div>
                </Spin>
            </div>
        }</React.Fragment>
    }

} 
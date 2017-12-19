import * as React from 'react';
import { connect } from 'react-redux';
import QueueAnim from 'rc-queue-anim';

interface DashboardPropsType {

}

class Dashboard extends React.Component<DashboardPropsType, any>{
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <QueueAnim delay={500}>
                <div key='dd'>
                    <h3>
                        welcome to my blog!
                    </h3>
                </div>
            </QueueAnim>
        )
    }
}

function mapStateToProps(state: any) {
    return {

    }
}

export default connect(mapStateToProps)(Dashboard)

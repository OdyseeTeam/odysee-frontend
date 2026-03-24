import { connect } from 'react-redux';
import Counter from './view';

const select = (state) => ({});

const perform = {};

export default connect(select, perform)(Counter);

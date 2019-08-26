import { connect } from 'react-redux';
import { ReduxState } from '../store';
import Header, { HeaderProps } from '../components/Header/Header';

const mapStateToProps = (state: ReduxState): HeaderProps => ({
  course: state.course.course,
});

const HeaderContainer = connect(mapStateToProps)(Header);

export default HeaderContainer;

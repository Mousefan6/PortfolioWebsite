import SpaceScene from '../components/SpaceScene';
import ControlButtons from '../components/ControlButtons';

const LandingPage = () => {
    return (
        <div className="flex flex-col items-center">
            <SpaceScene />
            <ControlButtons />
        </div>
    )
}

export default LandingPage
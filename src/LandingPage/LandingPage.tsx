import SaturnScene from '../components/SaturnScene';
import ControlButtons from '../components/ControlButtons';

const LandingPage = () => {
    return (
        <div className="flex flex-col items-center">
            <SaturnScene />
            <ControlButtons />
        </div>
    )
}

export default LandingPage
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Platform,
	StatusBar,
	StyleSheet,
	Text,
	View,
	SafeAreaView,
	Image,
	TouchableWithoutFeedback,
	Button,
	ImageBackground,
	Pressable,
	Dimensions,
	Switch,
	Vibration,
	Alert,
} from "react-native";
import { Audio } from "expo-av";

standard = {
	fontFamily: "serif",
	primaryColor: "red",
	secondaryColor: "darkgreen",
	white: "white",
};

const WORK_TEXT = "Work";
const WORK_MIN = 25;
const WORK_SEC = 0;
const BREAK_TEXT = "Break";
const BREAK_MIN = 5;
const BREAK_SEC = 0;
const MAJOR_VIBRATE = 1000;
const MINOR_VIBRATE = 100;

// Custom hook
const useDidMountEffect = (func, deps) => {
	const didMount = useRef(false);
	useEffect(() => {
		if (didMount.current) {
			func();
		} else {
			didMount.current = true;
		}
	}, deps);
};

export default function App() {
	const [workTime, setWorkTime] = useState({
		workMin: WORK_MIN,
		workSec: WORK_SEC,
	});
	const [breakTime, setBreakTime] = useState({
		breakMin: BREAK_MIN,
		breakSec: BREAK_SEC,
	});
	const [curTime, setCurTime] = useState({
		curMin: workTime.workMin,
		curSec: workTime.workSec,
	});
	const [status, setStatus] = useState("Work");
	const [timerRunning, setTimerRunning] = useState(false);
	const [timerResetting, setTimerResetting] = useState(false);
	const [doVibrate, setDoVibrate] = useState(false);
	const [doSound, setDoSound] = useState(false);
	const [sound, setSound] = useState();

	const intervalRef = useRef();
	const runAfterResetRef = useRef(false);
	const resetForNewTimeInputRef = useRef(true);

	const startOrPauseTimer = useCallback(() => {
		if (doSound) playSound();
		if (doVibrate) Vibration.vibrate(MINOR_VIBRATE);
		if (!timerResetting) {
			// Start timer
			if (!timerRunning) {
				setTimerRunning(true);
			}
			// Pause timer
			else {
				runAfterResetRef.current = false;
				setTimerRunning(false);
				// clearInterval(intervalRef.current);
			}
		}
	}, [timerRunning, timerResetting, doVibrate, doSound]);

	const switchStatus = useCallback(() => {
		if (doSound) playSound();
		if (doVibrate) Vibration.vibrate(MAJOR_VIBRATE);
		// Stop timer before every reset
		runAfterResetRef.current = timerRunning;
		if (timerRunning) {
			setTimerRunning(false);
		}
		if (status == "Work") {
			setStatus("Break");
		} else {
			setStatus("Work");
		}
	}, [status, timerRunning, doVibrate, doSound]);

	const resetTime = useCallback(() => {
		if (doSound) playSound();
		if (doVibrate) Vibration.vibrate(MINOR_VIBRATE);
		if (!timerResetting) {
			// Stop timer before every reset
			if (timerRunning) {
				setTimerRunning(false);
			}
			runAfterResetRef.current = false;
			setTimerResetting(true);
		}
	}, [timerResetting, timerRunning, doVibrate, doSound]);

	const getTimeText = useCallback(() => {
		let timeText = "";
		if (curTime.curMin < 10) {
			timeText += "0" + curTime.curMin;
		} else {
			timeText += "" + curTime.curMin;
		}
		timeText += ":";
		if (curTime.curSec < 10) {
			timeText += "0" + curTime.curSec;
		} else {
			timeText += "" + curTime.curSec;
		}
		return timeText;
	}, [curTime]);

	const getStartOrPauseText = useCallback(() => {
		if (timerRunning || runAfterResetRef.current) {
			return "Pause";
		}
		return "Start";
	}, [timerRunning, timerResetting]);

	const newTimeInput = useCallback(
		(workOrBreak, minToChange) => {
			if (doSound) playSound();
			if (doVibrate) Vibration.vibrate(MINOR_VIBRATE);
			if (timerResetting) {
				return;
			}
			resetForNewTimeInputRef.current = workOrBreak == status;

			// Stop timer before every reset
			runAfterResetRef.current = timerRunning;
			if (timerRunning && resetForNewTimeInputRef.current) {
				setTimerRunning(false);
			}

			let newMin;
			if (workOrBreak == "Work") {
				newMin = workTime.workMin + minToChange;
				if (newMin < 1 || newMin > 99) {
					return;
				}
				setWorkTime({ workMin: newMin, workSec: workTime.workSec });
			} else {
				newMin = breakTime.breakMin + minToChange;
				if (newMin < 1 || newMin > 99) {
					return;
				}
				setBreakTime({
					breakMin: newMin,
					breakSec: breakTime.breakSec,
				});
			}
		},
		[
			workTime,
			breakTime,
			status,
			timerRunning,
			timerResetting,
			doVibrate,
			doSound,
		]
	);

	const toggleSound = useCallback(() => {
		setDoSound(!doSound);
	}, [doSound]);

	async function playSound() {
		const { sound } = await Audio.Sound.createAsync(
			require("./assets/button_press.mp3")
		);
		setSound(sound);

		await sound.playAsync();
	}

	const toggleVibrate = useCallback(() => {
		setDoVibrate(!doVibrate);
	}, [doVibrate]);

	// timerRunning mounts
	useDidMountEffect(() => {
		if (timerRunning) {
			intervalRef.current = setInterval(() => {
				setCurTime((prevTime) => {
					if (prevTime.curMin > 0 && prevTime.curSec <= 0) {
						return {
							curMin: prevTime.curMin - 1,
							curSec: 59,
						};
					} else if (prevTime.curMin <= 0 && prevTime.curSec <= 1) {
						switchStatus();
						return prevTime;
					}
					return {
						curMin: prevTime.curMin,
						curSec: prevTime.curSec - 1,
					};
				});
			}, 1000);
			return () => {
				if (intervalRef.current) {
					intervalRef.current = clearInterval(intervalRef.current);
				}
			};
		} else {
			if (intervalRef.current) {
				intervalRef.current = clearInterval(intervalRef.current);
			}
		}
	}, [timerRunning]);

	// timerResetting mounts
	useDidMountEffect(() => {
		if (timerResetting) {
			// Reset
			setCurTime(() => {
				if (status == "Work") {
					return {
						curMin: workTime.workMin,
						curSec: workTime.workSec,
					};
				} else {
					return {
						curMin: breakTime.breakMin,
						curSec: breakTime.breakSec,
					};
				}
			});
			setTimerResetting(false);
			// Start timer after reset?
			if (runAfterResetRef.current) {
				setTimerRunning(true);
			}
		}
	}, [timerResetting, status]);

	// status mounts
	useDidMountEffect(() => {
		setTimerResetting(true);
	}, [status]);

	// workTime or breakTime mounts
	useDidMountEffect(() => {
		if (resetForNewTimeInputRef.current) {
			setTimerResetting(true);
		}
	}, [workTime, breakTime]);

	useEffect(() => {
		return sound
			? () => {
					sound.unloadAsync();
			  }
			: undefined;
	}, [sound]);

	return (
		<ImageBackground
			style={styles.container}
			blurRadius={3}
			source={{
				uri: "https://i.pinimg.com/564x/a8/14/8f/a8148f9b156b56995ade50f6bd0ae1a1.jpg",
			}}
		>
			<View style={styles.logoContainer}>
				<TouchableWithoutFeedback
					onPress={() =>
						Alert.alert("Tomato", "Don't touch!", [
							{ text: "OK" },
							{ text: "No" },
						])
					}
				>
					<Image
						resizeMode="contain"
						source={{
							width: 200,
							height: 180,
							uri: "https://4vector.com/i/free-vector-cut-tomato-clip-art_112920_Cut_Tomato_clip_art_hight.png",
						}}
					/>
				</TouchableWithoutFeedback>
				<Text style={styles.titleText}>Pomodoro</Text>
			</View>

			<View style={styles.timerContainer}>
				<Text style={styles.timerText}>{getTimeText()}</Text>
				<Text style={styles.statusText}>
					{status == "Work" ? WORK_TEXT : BREAK_TEXT}
				</Text>
			</View>

			<View style={styles.buttonsContainer}>
				<Pressable
					style={styles.button}
					onPress={() => startOrPauseTimer()}
				>
					<Text style={styles.primaryText}>
						{getStartOrPauseText()}
					</Text>
				</Pressable>
				<Pressable style={styles.button} onPress={() => switchStatus()}>
					<Text style={styles.primaryText}>Skip</Text>
				</Pressable>
				<Pressable style={styles.button} onPress={() => resetTime()}>
					<Text style={styles.primaryText}>Reset</Text>
				</Pressable>
			</View>

			<View style={styles.settingsContainer}>
				<View style={styles.subSettingsContainer}>
					<Text style={styles.primaryText}>Work Time: </Text>
					<Pressable
						style={styles.timeInputButton}
						onPress={() => newTimeInput("Work", -1)}
					>
						<Text style={styles.primaryText}>-</Text>
					</Pressable>
					<Text style={styles.primaryText}>{workTime.workMin}</Text>
					<Pressable
						style={styles.timeInputButton}
						onPress={() => newTimeInput("Work", 1)}
					>
						<Text style={styles.primaryText}>+</Text>
					</Pressable>
					<Text style={styles.primaryText}>Mins</Text>
				</View>
				<View style={styles.subSettingsContainer}>
					<Text style={styles.primaryText}>Break Time: </Text>
					<Pressable
						style={styles.timeInputButton}
						onPress={() => newTimeInput("Break", -1)}
					>
						<Text style={styles.primaryText}>-</Text>
					</Pressable>
					<Text style={styles.primaryText}>{breakTime.breakMin}</Text>
					<Pressable
						style={styles.timeInputButton}
						onPress={() => newTimeInput("Break", 1)}
					>
						<Text style={styles.primaryText}>+</Text>
					</Pressable>
					<Text style={styles.primaryText}>Mins</Text>
				</View>
				<View style={styles.subSettingsContainer}>
					<Text style={styles.primaryText}>Sound: </Text>
					<PomSwitch value={doSound} onValueChange={toggleSound} />
					<Text style={styles.primaryText}>Vibration: </Text>
					<PomSwitch
						value={doVibrate}
						onValueChange={toggleVibrate}
					/>
				</View>
			</View>

			<StatusBar style="auto" />
		</ImageBackground>
	);
}

function PomSwitch(props) {
	return (
		<Switch
			trackColor={{ true: "green", false: "red" }}
			thumbColor={standard.white}
			ios_backgroundColor={standard.white}
			value={props.value}
			onValueChange={props.onValueChange}
		/>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		// justifyContent: "center",
		alignItems: "center",
		paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
		// backgroundColor: "#090",
	},
	logoContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		borderBottomColor: standard.white,
		borderBottomWidth: 2,
	},
	titleText: {
		color: standard.primaryColor,
		fontFamily: standard.fontFamily,
		fontSize: 60,
		marginBottom: 20,
	},
	timerContainer: {
		flex: 0.3,
		justifyContent: "center",
		alignItems: "center",
		margin: 20,
		marginTop: 30,
	},
	timerText: {
		color: standard.white,
		fontSize: 70,
		fontFamily: standard.fontFamily,
	},
	statusText: {
		color: standard.white,
		fontSize: 40,
		fontFamily: standard.fontFamily,
	},
	buttonsContainer: {
		flex: 1,
		width: 0.75 * Dimensions.get("window").width,
		maxHeight: 100,
		flexDirection: "row",
		justifyContent: "space-evenly",
	},
	button: {
		backgroundColor: standard.secondaryColor,
		borderRadius: 2,
		padding: 7,
		width: 60,
		alignItems: "center",
		alignSelf: "center",
	},
	settingsContainer: {
		flex: 0.8,
		justifyContent: "space-evenly",
		width: 250,
		// maxHeight: 50,
		// marginTop: "auto",
		borderTopColor: standard.white,
		borderTopWidth: 2,
	},
	subSettingsContainer: {
		flexDirection: "row",
		justifyContent: "space-evenly",
		alignItems: "center",
	},
	timeInputButton: {
		backgroundColor: standard.secondaryColor,
		borderRadius: 2,
		// padding: 7,
		paddingBottom: 1,
		width: 30,
		height: 30,
		justifyContent: "center",
		alignItems: "center",
		// alignSelf: "center",
	},
	primaryText: {
		color: standard.white,
		fontFamily: standard.fontFamily,
	},
});

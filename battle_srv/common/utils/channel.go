package utils

func CloseStrChanSafely(ch chan string) {
	defer func() { recover() }()
	close(ch)
}

func SendStrSafely(msg string, ch chan string) {
	defer func() { recover() }()
	select {
	case ch <- msg:
		return
	default:
		return
	}
}

func CloseSafely(ch chan interface{}) {
	defer func() { recover() }()
	close(ch)
}

func SendSafely(msg interface{}, ch chan interface{}) {
	defer func() { recover() }()
	select {
	case ch <- msg:
		return
	default:
		return
	}
}

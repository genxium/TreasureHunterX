package utils

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

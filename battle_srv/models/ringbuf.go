package models

type RingBuffer struct {
	Elements []*RoomDownsyncFrame
	Head     int
	Tail     int
	Length   int
}

func NewRingBuffer(len int) *RingBuffer {
	return &RingBuffer{
		Elements: make([]*RoomDownsyncFrame, len),
		Head:     0,
		Tail:     0,
		Length:   len,
	}
}

func (rb *RingBuffer) Put(f *RoomDownsyncFrame) {
	if (rb.Tail+1)%rb.Length == rb.Head {
		rb.Head = (rb.Head + 1) % rb.Length
	}
	rb.Elements[rb.Tail] = f
	rb.Tail = (rb.Tail + 1) % rb.Length
}

func (rb *RingBuffer) Get(id int32) *RoomDownsyncFrame {
	for _, v := range rb.Elements {
		if v != nil && v.Id == id {
			return v
		}
	}
	return nil
}

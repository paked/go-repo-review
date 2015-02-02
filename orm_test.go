package main

import (
	"gopkg.in/mgo.v2/bson"
	"testing"
)

func TestSetValues(t *testing.T) {
	// type S struct {
	// 	ID       bson.ObjectId `bson:"_id"`
	// 	Username string        `bson:"username"`
	// }

	// s := S{}
	// SetValues(&s, bson.M{"_id": bson.NewObjectId(), "username": "paked"})

	// if s.Username != "paked" {
	// 	t.Error("Username should equal `paked`")
	// }

}

type Dog struct {
	BID   bson.ObjectId `bson:"_id"`
	Name  string        `bson:"name"`
	Owner string        `bson:"owner"`
	Age   int           `bson:"age"`
}

func (d Dog) ID() bson.ObjectId {
	return d.BID
}

func (d Dog) C() string {
	return "dogs"
}

var d *Dog

func TestModeller(t *testing.T) {
	server = NewServer()

	d = &Dog{BID: bson.NewObjectId(), Name: "Doggy", Owner: "James", Age: 10}
	c := server.Collection(d.C())

	err := c.Insert(d)

	if err != nil {
		t.Error("Could not insert that model", err)
		t.FailNow()
	}

	if err := UpdateModel(d, bson.M{"age": 5}); err != nil {
		t.Error("Could not udpate model", err)
		t.FailNow()
	}

	if d.Age != 5 {
		t.Error("Age should be 5, not ", d.Age)
	}

}

func TestPersist(t *testing.T) {
	e := &Dog{}
	err := RestoreModel(e, d.ID())

	if err != nil {
		t.Error("Error restoring model:", err)
	}

	if e.ID() != d.ID() {
		t.Error("This is not the same model...")
	}

}

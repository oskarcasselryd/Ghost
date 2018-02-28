import numpy as n

def str2bool(v):
	return v.lower() in ("true")
	
f = open("out","r")
boolean = n.full(30,False,dtype=bool)
for line in f:
	line = line.split(" ")
	for i in range(0,30):
		boolean[i] = n.logical_or(boolean[i],str2bool(line[i]))
		
print(boolean)


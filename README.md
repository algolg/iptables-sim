# iptables-sim

iptables-sim is a simple web-based simulator for basic iptables firewall commands, which can be accessed at [https://algolg.github.io/iptables-sim/](https://algolg.github.io/iptables-sim/).

The right side of the simulator shows a host PC's bash terminal, where iptables commands may be executed; this PC will have an IP address of 192.168.0.10/24. The left side displays a testing interface, where an outside host can attempt to initiate connections to the PC.

The following iptables flags have been implemented so far:
| flag              |  purpose         |
|-------------------|------------------|
| `-A`/`--append`   | append rule to end of chain |
| `-P`/`--policy`   | set default policy for chain |
| `-S`/`--list-rules` | list all rules in chain |
| `-D`/`--delete`   | delete matchine rule from chain |
| `-i`/`--in-interface` | match packets by ingress interface |
| `-o`/`--out-interface` | match packets by egress interface | 
| `-p`/`--protocol` | match packets by protocol |
| `-s`/`--source`   | match packets by source ip/subnet |
| `-d`/`--destination` | match packets by destination ip/subnet |
| `--sport`/`--source-port` | match packets by source port/port range |
| `--sports`/`--source-ports` | match packets by multiple source ports/port ranges |
| `--dport`/`--destination-port` | match packets by destination port/port range |
| `--dports`/`--destination-ports` | match packets by multiple destination ports/port ranges |
| `-m`/`--match`    | used with argument `conntrack` to enable stateful inspection or `multiport` to match multiple ports |
| `--ctstate`       | match packets with the selected state |
| `-j`/`--jump`     | set target action for rule |

More detailed information on commands and their purposes can be found on the man pages for iptables

## Topology

The main PC has an IPv4 address of 192.168.0.10 and a subnet mask of 255.255.255.0. This means that its network ranges from 192.168.0.0 to 192.168.0.255.

Though it isn't visible, there is also a DNS server at 1.1.1.1 (accessible on UDP port 53), which will resolve `example.com` to a web server at 1.1.1.10. This web server can be accessed using HTTP (TCP 80).

The tester's IP address can be changed as you wish, but in order to isolate all preconfigured networks from the testing interface, the tester's source IP cannot be from 192.168.0.0/24 or 1.1.1.0/24.

You can assume that all routers are totally permissive, without any firewall rules configured on them. The only firewall rules in place will be the ones which you configure on the PC yourself.

## Limitations

Since the host PC is an endpoint itself, it didn't seem important for me to include the default FORWARD chain. For this reason, the only chains that are supported are the INPUT and OUTPUT chains.
